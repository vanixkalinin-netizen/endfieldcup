"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { issueTelegramVerificationToken } from "@/lib/telegram";
import {
  type FormState,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validators";

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

    const verificationToken = await issueTelegramVerificationToken({
      id: user.id,
      email: parsed.data.email,
      nickname: parsed.data.nickname,
    });

    return {
      status: "success",
      message: "Аккаунт создан. Подтвердите его через Telegram-бота.",
      values: {
        email: parsed.data.email,
      },
      verificationToken,
    };
  } catch (error) {
    console.error("[registerAction] Unexpected error", error);

    return {
      status: "error",
      message:
        "Во время регистрации произошла ошибка. Попробуйте еще раз чуть позже.",
      values: payload,
    };
  }
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
    const verificationToken = await issueTelegramVerificationToken({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return {
      status: "error",
      message:
        "Подтвердите аккаунт через Telegram-бота перед входом.",
      values: {
        email: user.email,
      },
      verificationToken,
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
      message: "Текущий пароль введен неверно.",
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
    message: "Пароль успешно обновлен.",
  };
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/");
}
