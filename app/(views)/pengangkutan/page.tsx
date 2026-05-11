import type { Metadata } from "next";
import PengangkutanPage from "./pengangkutanpage-client";

export const metadata: Metadata = {
  title: "Pengangkutan",
};

export default function Page() {
  return <PengangkutanPage />;
}
