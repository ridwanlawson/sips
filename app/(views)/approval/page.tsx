import type { Metadata } from "next";
import Approval from "./approval-client";

export const metadata: Metadata = {
  title: "Persetujuan",
};

export default function Page() {
  return <Approval />;
}
