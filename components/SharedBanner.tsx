"use client";

import { getGreeting } from "@/lib/greeting";

// Shared component rendered on BOTH /login and /dashboard.
// Changing this component should surface visual diffs on every screen that uses it.
export default function SharedBanner() {
  const greeting = getGreeting();

  return (
    <div
      data-testid="banner-shared"
      style={{
        padding: "10px 16px",
        background: "#eef0ff",
        color: "#1a1a2e",
        borderRadius: 6,
        marginBottom: 16,
      }}
    >
      {greeting} — welcome to Everfit
    </div>
  );
}
