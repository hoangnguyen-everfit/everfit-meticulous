"use client";

import { useEffect } from "react";
import { injectAuthForReplay, capturePerformance } from "@/lib/meticulous";

// Runs Meticulous-specific bootstrapping once on mount.
export default function MeticulousBootstrap() {
  useEffect(() => {
    injectAuthForReplay();
    capturePerformance();
  }, []);
  return null;
}
