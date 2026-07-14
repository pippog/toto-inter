export default function MatchesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-black/5" />
      <div className="h-9 w-64 animate-pulse rounded-xl bg-black/5" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 animate-pulse rounded-full bg-black/5" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-black/5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="size-9 animate-pulse rounded-full bg-black/5" />
              <div className="h-4 w-10 animate-pulse rounded bg-black/5" />
              <div className="size-9 animate-pulse rounded-full bg-black/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
