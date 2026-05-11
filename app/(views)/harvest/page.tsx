import type { Metadata } from "next";
import HarvestPage from "./harvestpage-client";

export const metadata: Metadata = {
  title: "Harvesting",
};

export default function Page() {
  return <HarvestPage />;
}
