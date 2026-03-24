export default function AppLoading() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
    </div>
  )
}
