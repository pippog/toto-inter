import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-inter-navy via-inter-navy to-inter-black p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <Image src="/inter-logo.png" alt="Inter" width={28} height={28} className="size-7" />
          <p className="text-lg font-semibold tracking-tight text-heading">
            il<span className="text-inter-gold">Giochino</span>
          </p>
        </div>
        <h1 className="mb-6 mt-1 text-sm text-zinc-500">Password dimenticata</h1>
        <ForgotPasswordForm />
        <Link href="/login" className="mt-6 block text-center text-sm text-zinc-500 hover:underline">
          Torna al login
        </Link>
      </div>
    </div>
  );
}
