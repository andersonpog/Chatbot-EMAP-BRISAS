import { NextResponse } from "next/server";

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const res = await fetch(`${NESTJS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, senha: body.senha }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.message || "Credenciais inválidas" }, { status: res.status });
    }
    const data = await res.json();
    const { access_token } = data;
    const payloadB64 = access_token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    const response = NextResponse.json({ ok: true, role: payload.role, user: data.user });
    response.cookies.set("token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Servidor indisponível" }, { status: 503 });
  }
}
