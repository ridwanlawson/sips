/**
 * Shared download utility — extracted from duplicated code in login-client.tsx and navbar.tsx
 */
import { cookieStore } from "@/utils/cookieStore";
import { backendApiUrl } from "@/utils/backendConfig";
import toast from "react-hot-toast";

interface DownloadCheckResponse {
  download_url?: string;
  message?: string;
}

export async function checkAndDownloadApp() {
  const token =
    cookieStore.getCookie("auth_token") ||
    cookieStore.getCookie("token") ||
    cookieStore.getCookie("access_token") ||
    "";

  const endpoint = backendApiUrl("/app-update/check");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ platform: "android" }),
    });

    const data: DownloadCheckResponse = await response.json();

    if (response.ok && data.download_url) {
      window.open(data.download_url, "_blank");
    } else {
      toast.error(data.message || "Gagal mendapatkan link download");
    }
  } catch {
    toast.error("Terjadi kesalahan saat memeriksa update");
  }
}
