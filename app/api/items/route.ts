import { NextResponse } from "next/server";

// Mock API so the Dashboard makes a real network request for Meticulous to record & replay.
export async function GET() {
  return NextResponse.json({
    items: [
      { id: 1, name: "Workout A" },
      { id: 2, name: "Workout B" },
      { id: 3, name: "Workout C" },
    ],
  });
}
