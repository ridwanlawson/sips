"use client";

import dynamic from "next/dynamic";
import { SkeletonTable } from "./skeletons";

const DataTable = dynamic(
  () => import("react-data-table-component").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <SkeletonTable rows={5} />,
  },
) as any;

export default DataTable;
