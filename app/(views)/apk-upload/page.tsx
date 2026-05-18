import type { Metadata } from "next";
import ApkUploadWrapper from "./apk-upload-wrapper";

export const metadata: Metadata = { title: "Upload APK" };

export default function Page() {
  return <ApkUploadWrapper />;
}
