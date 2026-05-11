import type { Metadata } from "next";
import Attendance from "./attendance-client";

export const metadata: Metadata = {
  title: "Absensi",
};

export default function Page() {
  return <Attendance />;
}
