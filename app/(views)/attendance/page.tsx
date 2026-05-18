import type { Metadata } from "next";
import AttendanceWrapper from "./attendance-wrapper";

export const metadata: Metadata = { title: "Absensi" };

export default function Page() {
  return <AttendanceWrapper />;
}
