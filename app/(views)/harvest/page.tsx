import type { Metadata } from "next";
import HarvestWrapper from "./harvest-wrapper";

export const metadata: Metadata = { title: "Harvesting" };

export default function Page() {
  return <HarvestWrapper />;
}
