"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Usuários", href: "/admin/usuarios", icon: "👥" },
  { label: "Atendimento", href: "/atendimento", icon: "💬" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("N");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.nome) setUserName(d.nome); }).catch(() => {});
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, backgroundColor: "#128C7E", display: "flex", flexDirection: "column", color: "#fff" }}>
        <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>EMAP Brisas</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>Painel Admin</div>
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {navItems.map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                backgroundColor: pathname === item.href ? "rgba(255,255,255,0.2)" : "transparent",
                border: "none", borderRadius: 8, color: "#fff", fontSize: 14, cursor: "pointer", textAlign: "left", marginBottom: 4
              }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</span>
          <button onClick={logout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, padding: 0 }}>Sair</button>
        </div>
      </aside>
      {/* Content */}
      <main style={{ flex: 1, overflow: "auto", backgroundColor: "#f0f2f5" }}>
        {children}
      </main>
    </div>
  );
}
