import type { Metadata } from "next";
import HarvestingQualityUploadPage from "./harvestingqualityuploadpage-client";

export const metadata: Metadata = {
  title: "Upload Harvesting Quality",
};

export default function Page() {
  return <HarvestingQualityUploadPage />;
}
