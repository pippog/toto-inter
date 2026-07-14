import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-inter-navy via-inter-navy to-inter-black p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-lg font-semibold tracking-tight text-heading">
          Toto<span className="text-inter-gold">-Inter</span>
        </p>
        <h1 className="mb-6 mt-1 text-sm text-zinc-500">Accedi al tuo account</h1>
        <LoginForm />
      </div>
    </div>
  );
}
