import { VerifyForm } from "@/components/forms/verify-form";

type VerifyPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_460px]">
      <section className="panel p-7 md:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[#8891dd]">Verification relay</p>
        <h2 className="mt-4 font-heading text-4xl font-bold uppercase tracking-[0.08em] text-white md:text-5xl">
          Подтверждение аккаунта
        </h2>
        <p className="mt-4 max-w-2xl text-white/60">
          Введите шестизначный код из письма, чтобы активировать аккаунт и открыть подачу заявок на турниры.
        </p>
      </section>

      <section className="panel p-7">
        <h3 className="font-heading text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Ввести код
        </h3>
        <div className="mt-6">
          <VerifyForm email={params.email} />
        </div>
      </section>
    </div>
  );
}
