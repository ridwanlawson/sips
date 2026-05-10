import { SkeletonTable } from "@/app/components/skeletons";

export default function AttendanceLoading() {
  return (
    <div className="p-4 space-y-4">
      {/* Filter Bar Skeleton */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <div className="skeleton h-10 w-32"></div>
          <div className="skeleton h-10 w-32"></div>
          <div className="skeleton h-10 w-32"></div>
        </div>
        <div className="skeleton h-10 w-24"></div>
      </div>

      {/* Table Skeleton */}
      <SkeletonTable rows={10} />
    </div>
  );
}
