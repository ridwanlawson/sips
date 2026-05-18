"use client";

import dynamic from "next/dynamic";
import { SkeletonCard, SkeletonChart } from "@/app/components/skeletons";

// Dashboard adalah komponen terbesar (~2800 baris) — lazy load wajib
const UserDashboard = dynamic(() => import("./userdashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <SkeletonChart />
    </div>
  ),
});

export default function DashboardWrapper() {
  return <UserDashboard />;
}
