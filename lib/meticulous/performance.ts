// Capture real frontend performance. Note: The official Meticulous API does NOT
// provide window.Meticulous.replay.native.performance. During replay, we use
// window.performance directly since Meticulous does not stub performance APIs. (#8)
export function capturePerformance(): void {
  if (typeof window === "undefined") return;

  const perf = window.performance;
  const nav = perf.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;

  const metric = {
    name: "domContentLoaded",
    value: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
  };

  window.__perfMetrics = window.__perfMetrics ?? [];
  window.__perfMetrics.push(metric);
  console.log("[meticulous][perf]", metric);
}
