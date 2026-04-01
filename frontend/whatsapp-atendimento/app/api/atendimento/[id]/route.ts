import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("token")?.value;
  const { acao } = await req.json();
  try {
    const res = await fetch(`${NESTJS_URL}/atendimento/${acao}/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({ error: "Erro ao atualizar atendimento" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
