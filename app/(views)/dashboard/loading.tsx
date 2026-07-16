import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/app/components/ui/skeletons';

export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>

      {/* Table */}
      <SkeletonTable rows={10} />
    </div>
  );
}

