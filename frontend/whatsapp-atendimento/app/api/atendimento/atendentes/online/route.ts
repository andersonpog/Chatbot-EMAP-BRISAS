import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  try {
    const res = await fetch(`${NESTJS_URL}/atendimento/atendentes/online`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar atendentes online" }, { status: res.status });
    }
    const response = NextResponse.json(await res.json());
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
