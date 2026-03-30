import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "emap-chatbot-2026");
    const { payload } = await jwtVerify(token, secret);
    redirect(payload.role === "ADMIN" ? "/admin" : "/atendimento");
  } catch {
    redirect("/login");
  }
}
