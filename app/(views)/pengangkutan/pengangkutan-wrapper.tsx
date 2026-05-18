"use client";

import dynamic from "next/dynamic";
import { SkeletonTable } from "@/app/components/skeletons";

const PengangkutanPage = dynamic(() => import("./pengangkutanpage-client"), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function PengangkutanWrapper() {
  return <PengangkutanPage />;
}
