"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getNotificationDelegate() {
  return (prisma as { notification?: typeof prisma.notification }).notification;
}

export async function openNotificationAction(formData: FormData) {
  const user = await requireUser();
  const notificationId = String(formData.get("notificationId") ?? "");
  const notificationDelegate = getNotificationDelegate();

  if (!notificationId || !notificationDelegate) {
    redirect("/");
  }

  const notification = await notificationDelegate.findFirst({
    where: {
      id: notificationId,
      userId: user.id,
    },
    select: {
      href: true,
    },
  });

  if (!notification) {
    redirect("/");
  }

  await notificationDelegate.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  redirect(notification.href || "/");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  const notificationDelegate = getNotificationDelegate();

  if (!notificationDelegate) {
    refresh();
    return;
  }

  await notificationDelegate.updateMany({
    where: {
      userId: user.id,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  refresh();
}
