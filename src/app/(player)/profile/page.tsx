import { getCurrentUser } from "@/lib/dal";
import { ChangePasswordForm } from "./change-password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-inter-navy">{user.name}</h1>
        <p className="text-sm text-zinc-500">{user.email}</p>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
