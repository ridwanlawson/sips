import type { Metadata } from "next";
import AttendanceUploadWrapper from "./attendance-upload-wrapper";

export const metadata: Metadata = { title: "Upload Absensi" };

export default function Page() {
  return <AttendanceUploadWrapper />;
}
