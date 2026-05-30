"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { issueTelegramVerificationToken } from "@/lib/telegram";
import { slugify } from "@/lib/utils";
import {
  type FormState,
  loginSchema,
  passwordChangeSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validators";

function buildInternalEmail(nickname: string) {
  const base = slugify(nickname) || "player";
  return `${base}-${crypto.randomUUID().slice(0, 8)}@telegram.local`;
}

export async function registerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const payload = {
    nickname: String(formData.get("nickname") ?? ""),
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
    const existingUser = await prisma.user.findUnique({
      where: { nickname: parsed.data.nickname },
    });

    if (existingUser?.isVerified) {
      return {
        status: "error",
        message: "Такой ник уже занят.",
        values: payload,
      };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            nickname: parsed.data.nickname,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            nickname: parsed.data.nickname,
            email: buildInternalEmail(parsed.data.nickname),
            passwordHash,
          },
        });

    const verificationToken = await issueTelegramVerificationToken({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return {
      status: "success",
      message: "Аккаунт создан. Подтвердите его через Telegram-бота.",
      values: {
        nickname: user.nickname,
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
    nickname: String(formData.get("nickname") ?? ""),
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
    where: { nickname: parsed.data.nickname },
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
      message: "Подтвердите аккаунт через Telegram-бота перед входом.",
      values: {
        nickname: user.nickname,
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
