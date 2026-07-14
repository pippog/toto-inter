import Image from "next/image";
import { SetPasswordForm } from "./set-password-form";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-inter-navy via-inter-navy to-inter-black p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <Image src="/inter-logo.png" alt="Inter" width={28} height={28} className="size-7" />
          <p className="text-lg font-semibold tracking-tight text-heading">
            Amaral<span className="text-inter-gold">game</span>
          </p>
        </div>
        <h1 className="mb-6 mt-1 text-sm text-zinc-500">Attiva il tuo account</h1>
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
