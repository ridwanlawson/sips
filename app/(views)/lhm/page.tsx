import type { Metadata } from "next";
import LhmWrapper from "./lhm-wrapper";

export const metadata: Metadata = { title: "LHM" };

export default function Page() {
  return <LhmWrapper />;
}
