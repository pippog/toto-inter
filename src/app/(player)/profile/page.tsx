import { getCurrentUser } from "@/lib/dal";
import { Avatar } from "@/components/avatar";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size={56} />
        <div>
          <h1 className="text-2xl font-semibold text-heading">{user.name}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
      </div>

      <ProfileForm
        initial={{
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
        }}
      />
      <ChangePasswordForm />
    </div>
  );
}
