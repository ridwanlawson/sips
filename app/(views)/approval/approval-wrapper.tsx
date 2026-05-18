"use client";

import dynamic from "next/dynamic";
import { SkeletonTable } from "@/app/components/skeletons";

const Approval = dynamic(() => import("./approval-client"), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <SkeletonTable rows={10} />
    </div>
  ),
});

export default function ApprovalWrapper() {
  return <Approval />;
}
