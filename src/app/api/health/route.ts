import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "aurant-pos-suite",
    time: new Date().toISOString(),
  });
}
