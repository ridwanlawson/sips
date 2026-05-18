"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import type { TableProps } from "react-data-table-component";
import { SkeletonTable } from "./skeletons";

type DataTableComponent = <T>(props: TableProps<T>) => ReactElement;

// react-data-table-component adalah library besar (~150KB).
// Dynamic import memastikan ia hanya di-load saat komponen ini dirender,
// bukan saat halaman pertama kali dibuka.
const DataTable = dynamic(
  () => import("react-data-table-component").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <SkeletonTable rows={5} />,
  },
) as unknown as DataTableComponent;

export default DataTable;
