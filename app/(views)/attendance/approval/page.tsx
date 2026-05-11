import type { Metadata } from "next";
import AttendanceApproval from "./attendanceapproval-client";

export const metadata: Metadata = {
  title: "Persetujuan Absensi",
};

export default function Page() {
  return <AttendanceApproval />;
}
