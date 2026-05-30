import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (token) {
    await fetch(`${NESTJS_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete("token");
  return response;
}
