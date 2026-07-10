import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-[200px] w-full" />
        </div>
        <div className="rounded-lg border border-border p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-[200px] w-full" />
        </div>
      </div>
    </div>
  );
}