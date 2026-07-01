// Returns a time-of-day greeting. Hour is injectable for deterministic tests.
export function getGreeting(hour: number = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
