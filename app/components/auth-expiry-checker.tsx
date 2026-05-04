"use client";

import { useEffect } from "react";
import { logoutAndRedirect } from "@/utils/authHelper";

const getCookieValue = (name: string): string => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`);
  return match ? decodeURIComponent(match.pop() as string) : "";
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const tokenIsExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload.exp;
  return typeof exp === "number" && Math.floor(Date.now() / 1000) >= exp;
};

export default function AuthExpiryChecker() {
  useEffect(() => {
    const token = getCookieValue("auth_token");
    if (!token) return;

    if (tokenIsExpired(token)) {
      logoutAndRedirect();
    }
  }, []);

  return null;
}
