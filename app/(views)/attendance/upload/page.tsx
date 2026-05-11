import type { Metadata } from "next";
import AttendanceUploadPage from "./attendanceuploadpage-client";

export const metadata: Metadata = {
  title: "Upload Absensi",
};

export default function Page() {
  return <AttendanceUploadPage />;
}
