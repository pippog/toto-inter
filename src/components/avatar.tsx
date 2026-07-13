function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  size = 32,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    // URL arbitraria incollata dall'utente (dominio sconosciuto a priori):
    // next/image richiederebbe di whitelistare i domini in anticipo.
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-inter-gold text-xs font-semibold text-inter-navy-dark"
    >
      {initials(name)}
    </div>
  );
}
