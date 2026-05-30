"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  type FormState,
  profileSchema,
} from "@/lib/validators";

export async function registerAction(
  _prevState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _prevState;
  void _formData;
  return {
    status: "error",
    message: "Регистрация теперь работает только через Discord.",
  };
}

export async function loginAction(
  _prevState: FormState,
  _formData: FormData,
): Promise<FormState> {
  void _prevState;
  void _formData;
  return {
    status: "error",
    message: "Вход теперь работает только через Discord.",
  };
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
  _formData: FormData,
): Promise<FormState> {
  void _prevState;
  void _formData;
  return {
    status: "error",
    message: "Смена пароля отключена: вход теперь работает только через Discord.",
  };
}

export async function logoutAction() {
  await clearSession();
  revalidatePath("/");
  redirect("/");
}
