"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error || "Credenciais inválidas"); return; }
      router.push(data.role === "ADMIN" ? "/admin" : "/atendimento");
    } catch {
      setErro("Servidor indisponível");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#eae6df", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      <div style={{ width: 380, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
        <div style={{ backgroundColor: "#128C7E", padding: "32px 24px", textAlign: "center", color: "#fff" }}>
          <svg width="52" height="52" viewBox="0 0 24 24" fill="#fff" style={{ marginBottom: 10 }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <div style={{ fontSize: 22, fontWeight: 700 }}>EMAP Brisas</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Atendimento WhatsApp</div>
        </div>
        <div style={{ backgroundColor: "#fff", padding: "32px 28px" }}>
          <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 600, color: "#111b21", textAlign: "center" }}>Entrar na conta</h2>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 6 }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#111b21" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 6 }}>Senha</label>
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", color: "#111b21" }} />
            </div>
            {erro && (
              <div style={{ backgroundColor: "#fff0f0", border: "1px solid #ffc0c0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#c0392b", fontSize: 13, textAlign: "center" }}>
                {erro}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: 12, backgroundColor: loading ? "#75bfb8" : "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
