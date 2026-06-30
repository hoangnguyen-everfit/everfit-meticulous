import { NextResponse } from "next/server";

// Health check endpoint for the Meticulous container (container-health-check-endpoint).
// A dedicated route returning 200 avoids depending on the "/" page redirect behavior.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
