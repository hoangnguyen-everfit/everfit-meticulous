// Capture real frontend performance using Meticulous native performance API when
// running in a benchmarkable replay context. Per official docs
// (https://app.meticulous.ai/docs/reference/performance-api),
// window.Meticulous.replay.native.performance bypasses deterministic stubbing and
// returns REAL performance values. We gate on isBenchmarkableReplay to ensure we
// only use native performance during benchmark replays. (#8)
export function capturePerformance(): void {
  if (typeof window === "undefined") return;

  const replay = window.Meticulous?.replay;
  const perf = replay?.isBenchmarkableReplay
    ? replay.native!.performance
    : window.performance;

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
