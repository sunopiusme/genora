"use client";

import { useEffect, useState } from "react";
import { MOBILE_MEDIA_QUERY } from "@/components/shared/breakpoints";

export function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);

    function handleChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}
