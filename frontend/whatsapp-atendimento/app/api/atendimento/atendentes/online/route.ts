import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  try {
    const res = await fetch(`${NESTJS_URL}/atendimento/atendentes/online`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Erro ao buscar atendentes online" }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
