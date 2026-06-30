export {};

interface MeticulousReplayNative {
  performance: Performance;
}

interface MeticulousApi {
  isRunningAsTest?: boolean;
  replay?: { native?: MeticulousReplayNative };
}

declare global {
  interface Window {
    Meticulous?: MeticulousApi;
    __perfMetrics?: Array<{ name: string; value: number }>;
  }
}
