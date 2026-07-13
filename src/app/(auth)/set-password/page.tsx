import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
        <h1 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
          Toto-Inter — attiva il tuo account
        </h1>
        {token ? (
          <SetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-red-600">
            Link non valido. Chiedi un nuovo invito all&apos;amministratore.
          </p>
        )}
      </div>
    </div>
  );
}
