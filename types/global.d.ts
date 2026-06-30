export {};

// Meticulous replay API structure per official docs
// (https://app.meticulous.ai/docs/reference/performance-api)
interface MeticulousReplay {
  isBenchmarkableReplay?: boolean;
  native?: { performance: Performance };
}

interface MeticulousApi {
  isRunningAsTest?: boolean;
  replay?: MeticulousReplay;
}

declare global {
  interface Window {
    Meticulous?: MeticulousApi;
    __perfMetrics?: Array<{ name: string; value: number }>;
  }
}
