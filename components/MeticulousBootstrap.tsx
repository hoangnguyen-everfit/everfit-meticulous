"use client";

import { useEffect } from "react";
import { injectAuthForReplay, capturePerformance } from "@/lib/meticulous";

// Runs Meticulous-specific bootstrapping once on mount.
// Wrapped in try/catch so a failure here can never crash the app (which would
// otherwise render Next's error boundary on every route during replay).
export default function MeticulousBootstrap() {
  useEffect(() => {
    try {
      injectAuthForReplay();
      capturePerformance();
    } catch (error) {
      console.error("[meticulous] bootstrap failed:", error);
    }
  }, []);
  return null;
}
