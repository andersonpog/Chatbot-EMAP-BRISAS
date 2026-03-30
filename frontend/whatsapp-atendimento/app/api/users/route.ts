import { NextRequest, NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  try {
    const res = await fetch(`${NESTJS_URL}/auth/funcionarios`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const body = await req.json();
  try {
    const res = await fetch(`${NESTJS_URL}/auth/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ error: data.message || "Erro ao criar usuário" }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
