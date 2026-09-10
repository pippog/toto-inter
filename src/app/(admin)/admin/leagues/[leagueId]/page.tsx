import { notFound } from "next/navigation";
import { getCurrentUser, requireLeagueRole } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { AddMemberForm } from "./add-member-form";
import { MemberRow } from "./member-row";

export default async function AdminLeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  // Raggiungibile anche da OWNER/MODERATOR non-ADMIN (vedi piano §4) — sola
  // lettura per un MODERATOR, la gestione membri resta a livello OWNER (o
  // ADMIN globale) nelle singole server action.
  await requireLeagueRole(leagueId, "MODERATOR");
  const currentUser = await getCurrentUser();

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      team: true,
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!league) notFound();

  const ownerCount = league.memberships.filter((m) => m.role === "OWNER").length;
  const myMembership = league.memberships.find((m) => m.userId === currentUser.id);
  const canManage = currentUser.role === "ADMIN" || myMembership?.role === "OWNER";

  const memberIds = new Set(league.memberships.map((m) => m.userId));
  const candidates = canManage
    ? (await prisma.user.findMany({ orderBy: { name: "asc" } })).filter((u) => !memberIds.has(u.id))
    : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-heading">{league.name}</h1>
        <p className="text-sm text-zinc-500">
          {league.team.name} · /{league.slug} · {league.memberships.length} membri
        </p>
      </div>

      {canManage && <AddMemberForm leagueId={league.id} candidates={candidates} />}

      <ul className="flex flex-col gap-2">
        {league.memberships.map((m) => (
          <MemberRow
            key={m.userId}
            leagueId={league.id}
            userId={m.userId}
            name={m.user.name}
            avatarUrl={m.user.avatarUrl}
            email={m.user.email}
            role={m.role}
            isLastOwner={m.role === "OWNER" && ownerCount <= 1}
            canManage={canManage}
          />
        ))}
      </ul>
    </div>
  );
}
