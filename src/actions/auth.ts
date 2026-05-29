"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, requireUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  type FormState,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
  verifySchema,
} from "@/lib/validators";
import { createVerificationCode } from "@/lib/utils";

export async function registerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    nickname: String(formData.get("nickname") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте поля формы.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  try {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    const existingByNickname = await prisma.user.findUnique({
      where: { nickname: parsed.data.nickname },
    });

    if (existingByEmail?.isVerified) {
      return {
        status: "error",
        message: "Аккаунт с такой почтой уже существует.",
        values: payload,
      };
    }

    if (existingByNickname && existingByNickname.email !== parsed.data.email) {
      return {
        status: "error",
        message: "Такой ник уже занят.",
        values: payload,
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = existingByEmail
      ? await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            nickname: parsed.data.nickname,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            nickname: parsed.data.nickname,
            email: parsed.data.email,
            passwordHash,
          },
        });

    const code = createVerificationCode();

    await prisma.verificationCode.deleteMany({
      where: {
        email: parsed.data.email,
        consumedAt: null,
      },
    });

    await prisma.verificationCode.create({
      data: {
        email: parsed.data.email,
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 15),
      },
    });

    const mailResult = await sendVerificationEmail({
      code,
      email: parsed.data.email,
      nickname: parsed.data.nickname,
    });

    return {
      status: "success",
      message: mailResult.delivered
        ? "Аккаунт создан. Код подтверждения отправлен на почту."
        : "Аккаунт создан. Почта пока не настроена, поэтому код показан ниже для локальной проверки.",
      values: {
        email: parsed.data.email,
      },
      debugCode: mailResult.debugCode,
    };
  } catch (error) {
    console.error("[registerAction] Unexpected error", error);

    return {
      status: "error",
      message:
        "Во время регистрации произошла ошибка. Попробуйте ещё раз чуть позже.",
      values: payload,
    };
  }
}

export async function verifyAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    code: String(formData.get("code") ?? ""),
  };

  const parsed = verifySchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Введите корректные данные.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      email: parsed.data.email,
      code: parsed.data.code,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });

  if (!verificationCode?.user) {
    return {
      status: "error",
      message: "Код недействителен или уже истёк.",
      values: payload,
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationCode.user.id },
      data: {
        isVerified: true,
      },
    }),
    prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        consumedAt: new Date(),
      },
    }),
    prisma.verificationCode.deleteMany({
      where: {
        userId: verificationCode.user.id,
        consumedAt: null,
        id: {
          not: verificationCode.id,
        },
      },
    }),
  ]);

  await createSession({
    id: verificationCode.user.id,
    email: verificationCode.user.email,
    nickname: verificationCode.user.nickname,
    role: verificationCode.user.role,
  });

  revalidatePath("/");
  redirect("/dashboard");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте данные для входа.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) {
    return {
      status: "error",
      message: "Пользователь не найден.",
      values: payload,
    };
  }

  const isValidPassword = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!isValidPassword) {
    return {
      status: "error",
      message: "Неверный пароль.",
      values: payload,
    };
  }

  if (!user.isVerified) {
    return {
      status: "error",
      message: "Подтвердите аккаунт кодом из письма перед входом.",
      values: {
        email: user.email,
      },
    };
  }

  await createSession({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    role: user.role,
  });

  revalidatePath("/");
  redirect(user.role === UserRole.ADMIN ? "/acp" : "/dashboard");
}

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const payload = {
    bio: String(formData.get("bio") ?? ""),
  };

  const parsed = profileSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте описание профиля.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: payload,
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      bio: parsed.data.bio?.trim() ?? "",
    },
  });

  revalidatePath("/profile");
  revalidatePath(`/players/${user.nickname}`);

  return {
    status: "success",
    message: "Описание профиля обновлено.",
    values: payload,
  };
}

export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const payload = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmNewPassword: String(formData.get("confirmNewPassword") ?? ""),
  };

  const parsed = passwordChangeSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Проверьте данные для смены пароля.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const matchesCurrentPassword = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash,
  );

  if (!matchesCurrentPassword) {
    return {
      status: "error",
      message: "Текущий пароль введён неверно.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
    },
  });

  return {
    status: "success",
    message: "Пароль успешно обновлён.",
  };
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/");
}
