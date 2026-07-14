export default function MatchDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-card">
        <div className="h-5 w-24 animate-pulse rounded-full bg-black/5" />
        <div className="h-6 w-48 animate-pulse rounded bg-black/5" />
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-card">
        <div className="h-5 w-40 animate-pulse rounded bg-black/5" />
        <div className="h-20 animate-pulse rounded-xl bg-black/5" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-black/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
