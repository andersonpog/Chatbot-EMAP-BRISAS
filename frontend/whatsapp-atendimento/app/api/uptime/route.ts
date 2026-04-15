import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  try {
    const res = await fetch(`${NESTJS_URL}/auth/uptime`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
