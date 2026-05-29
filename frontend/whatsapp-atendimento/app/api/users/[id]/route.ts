
import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get("token")?.value;
  const body = await req.json();
  try {
    const res = await fetch(`${NESTJS_URL}/auth/funcionarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.message || "Erro ao atualizar usuário" }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
