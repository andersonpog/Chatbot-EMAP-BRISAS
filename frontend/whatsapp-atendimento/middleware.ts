import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "emap-chatbot-2026");
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/atendimento", req.url));
    }

    // OBSERVADOR só pode acessar /atendimento
    if (role === "OBSERVADOR" && !pathname.startsWith("/atendimento") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/atendimento", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
