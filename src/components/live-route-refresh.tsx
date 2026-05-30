"use client";

import { startTransition, useEffect, useEffectEvent, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const HOME_REFRESH_INTERVAL = 5_000;
const DEFAULT_REFRESH_INTERVAL = 10_000;
const MIN_REFRESH_GAP = 2_500;

export function LiveRouteRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const lastRefreshAtRef = useRef(0);
  const refreshInterval =
    pathname === "/" ? HOME_REFRESH_INTERVAL : DEFAULT_REFRESH_INTERVAL;

  const refreshRoute = useEffectEvent((force: boolean) => {
    if (typeof document === "undefined") {
      return;
    }

    if (!force && document.visibilityState !== "visible") {
      return;
    }

    const now = Date.now();

    if (now - lastRefreshAtRef.current < MIN_REFRESH_GAP) {
      return;
    }

    lastRefreshAtRef.current = now;

    startTransition(() => {
      router.refresh();
    });
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshRoute(false);
    }, refreshInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshInterval]);

  useEffect(() => {
    function handleWindowFocus() {
      refreshRoute(true);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshRoute(true);
      }
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
