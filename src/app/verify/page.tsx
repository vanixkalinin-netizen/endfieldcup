import { TelegramVerifyPanel } from "@/components/telegram-verify-panel";
import { getTelegramVerificationStatus } from "@/lib/telegram";

type VerifyPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const status = await getTelegramVerificationStatus(token);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="panel relative overflow-hidden px-6 py-8 md:px-10 md:py-10 xl:px-14 xl:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(111,123,255,0.2),transparent_70%)] blur-3xl" />
          <div className="absolute right-[-3rem] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(111,123,255,0.16),transparent_72%)] blur-3xl" />
        </div>

        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,460px)] xl:items-center">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.38em] text-[#95a0ff]">
              Verification relay
            </p>
            <h2 className="mt-5 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl xl:text-6xl">
              Telegram-подтверждение
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/56 md:text-lg">
              Подтвердите аккаунт через Telegram-бота, чтобы открыть вход,
              заявки на турниры и админскую панель.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0c0f17]/88 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:p-8">
            <TelegramVerifyPanel token={token} initialStatus={status} />
          </div>
        </div>
      </section>
    </div>
  );
}
