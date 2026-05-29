import nodemailer from "nodemailer";

import { isSmtpConfigured } from "@/lib/utils";

type VerificationMailInput = {
  code: string;
  email: string;
  nickname: string;
};

export async function sendVerificationEmail({
  code,
  email,
  nickname,
}: VerificationMailInput) {
  if (!isSmtpConfigured()) {
    console.log(`[DEV MAIL] ${email} -> verification code: ${code}`);
    return {
      delivered: false,
      debugCode: code,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Код подтверждения аккаунта Endfield Cups",
      text: `Здравствуйте, ${nickname}!\n\nВаш код подтверждения: ${code}\nКод действует 15 минут.`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0b0d12; color: #f4f7ff; padding: 24px;">
          <h1 style="margin: 0 0 16px; font-size: 22px;">Endfield Cups</h1>
          <p style="margin: 0 0 12px;">Здравствуйте, ${nickname}.</p>
          <p style="margin: 0 0 12px;">Ваш код подтверждения:</p>
          <div style="display: inline-block; font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #7c6cff; background: #121725; border: 1px solid #30395b; border-radius: 14px; padding: 14px 18px;">
            ${code}
          </div>
          <p style="margin: 16px 0 0; color: #8f98b5;">Код действует 15 минут.</p>
        </div>
      `,
    });

    return {
      delivered: true,
    };
  } catch (error) {
    console.warn("[MAIL FALLBACK] Could not send SMTP mail:", error);
    console.log(`[DEV MAIL] ${email} -> verification code: ${code}`);

    return {
      delivered: false,
      debugCode: code,
    };
  }
}
