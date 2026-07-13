import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 dark:border-white/10 dark:bg-zinc-900">
        <h1 className="mb-6 text-xl font-semibold text-black dark:text-zinc-50">
          Toto-Inter — accedi
        </h1>
        <LoginForm />
      </div>
    </div>
  );
}
