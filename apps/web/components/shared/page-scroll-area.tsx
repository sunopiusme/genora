"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { MOBILE_MEDIA_QUERY } from "./breakpoints";

type PageScrollAreaProps = {
  className?: string;
  children: ReactNode;
};

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
    <div ref={scrollRef} className={className} data-glass-scroll="">
      {children}
    </div>
  );
}
