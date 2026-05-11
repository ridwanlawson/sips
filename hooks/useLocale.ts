import { useState, useEffect } from "react";
import { cookieStore } from "@/utils/cookieStore";

/**
 * Reactive hook that reads the current locale from the NEXT_LOCALE cookie.
 * Returns the BCP 47 locale tag (e.g. "id-ID" or "en-US") that can be
 * passed directly to toLocaleString() / toLocaleDateString().
 *
 * Updates automatically when the component mounts (client-side).
 */
export function useLocale(): string {
  const [localeTag, setLocaleTag] = useState<string>("en-US");

  useEffect(() => {
    setLocaleTag(cookieStore.getLocaleTag());
  }, []);

  return localeTag;
}
