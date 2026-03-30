import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "emap-chatbot-2026");
    const { payload } = await jwtVerify(token, secret);

    // Busca nome atualizado no NestJS
    const res = await fetch(`${NESTJS_URL}/auth/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ nome: data.usuarioLogado?.nome || payload.email, role: payload.role });
    }
    return NextResponse.json({ nome: payload.email, role: payload.role });
  } catch {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}
