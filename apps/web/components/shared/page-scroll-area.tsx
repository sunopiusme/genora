"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { MOBILE_MEDIA_QUERY } from "./breakpoints";

type PageScrollAreaProps = {
  className: string;
  children: ReactNode;
};

/**
 * Scroll container that returns to the top when the viewport crosses
 * the mobile breakpoint (device rotation, window resize, DevTools
 * device mode). Without this, the scroll offset from the previous
 * layout is kept, and the reflowed content appears shifted upward.
 */
export function PageScrollArea({ className, children }: PageScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    function handleChange() {
      scrollRef.current?.scrollTo({ top: 0 });
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div ref={scrollRef} className={className}>
      {children}
    </div>
  );
}
