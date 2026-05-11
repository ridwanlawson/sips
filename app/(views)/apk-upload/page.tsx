import type { Metadata } from "next";
import ApkUploadPage from "./apkuploadpage-client";

export const metadata: Metadata = {
  title: "Upload APK",
};

export default function Page() {
  return <ApkUploadPage />;
}
