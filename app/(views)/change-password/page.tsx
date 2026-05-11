import type { Metadata } from "next";
import ChangePasswordPage from "./changepasswordpage-client";

export const metadata: Metadata = {
  title: "Ganti Password",
};

export default function Page() {
  return <ChangePasswordPage />;
}
