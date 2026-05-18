"use client";

import dynamic from "next/dynamic";

const ApkUploadPage = dynamic(() => import("./apkuploadpage-client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-base-100 p-6 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  ),
});

export default function ApkUploadWrapper() {
  return <ApkUploadPage />;
}
