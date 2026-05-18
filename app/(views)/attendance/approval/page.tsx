import type { Metadata } from "next";
import AttendanceApprovalWrapper from "./attendance-approval-wrapper";

export const metadata: Metadata = { title: "Persetujuan Absensi" };

export default function Page() {
  return <AttendanceApprovalWrapper />;
}
