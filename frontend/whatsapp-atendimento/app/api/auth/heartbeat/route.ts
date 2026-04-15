import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  try {
    await fetch(`${NESTJS_URL}/auth/heartbeat`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
