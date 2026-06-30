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

// Mock write endpoint. In production this would persist; on replay Meticulous
// returns the recorded response, so there is no real side-effect. (#3)
export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  return NextResponse.json(
    { item: { id: 0, name: body.name ?? "" } },
    { status: 201 }
  );
}
