import type { Metadata } from "next";
import HarvestingUploadPage from "./harvestinguploadpage-client";

export const metadata: Metadata = {
  title: "Upload Harvesting",
};

export default function Page() {
  return <HarvestingUploadPage />;
}
