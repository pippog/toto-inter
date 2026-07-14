export default function LeaderboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 p-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-black/5" />

      <div className="flex items-end justify-center gap-4 md:gap-6">
        {[44, 56, 44].map((size, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="animate-pulse rounded-full bg-black/5" style={{ width: size, height: size }} />
            <div className="h-3 w-14 animate-pulse rounded bg-black/5" />
            <div className="h-16 w-16 animate-pulse rounded-t-xl bg-black/5" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-black/5" />
        ))}
      </div>
    </div>
  );
}
