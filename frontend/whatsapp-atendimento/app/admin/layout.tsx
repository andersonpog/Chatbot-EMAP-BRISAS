"use client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Usuários", href: "/admin/usuarios", icon: "👥" },
  { label: "Atendimento", href: "/atendimento", icon: "💬" },
  { label: "Configurações", href: "/admin/config", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("N");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (d.nome) setUserName(d.nome); }).catch(() => {});

    // Recupera a preferência do usuário salva no navegador
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const ping = () => fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };

  // SVGs de Sol e Lua para o menu Admin
  const MoonIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );

  const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      {/* Força tabelas, fundos brancos e bordas do Tailwind a ficarem escuras quando o dark mode estiver ativo */}
      <style dangerouslySetInnerHTML={{__html: `
        .dark .bg-white { background-color: #121212 !important; border-color: #333 !important; color: #fff !important; }
        .dark .text-gray-800, .dark .text-gray-900, .dark .text-black, .dark .text-gray-700 { color: #ffffff !important; }
        .dark .text-gray-600, .dark .text-gray-500, .dark .text-gray-400 { color: #f3f4f6 !important; }
        .dark .border-gray-200, .dark .border-gray-300, .dark .border { border-color: #333 !important; }
        
        .dark table, .dark table th, .dark table td { border-color: #333 !important; color: #fff !important; }
        .dark table thead, .dark table th { background-color: #1e1e1e !important; border-bottom: 1px solid #333 !important; }
        .dark table tbody, .dark table tbody tr { background-color: #121212 !important; }
        
        .dark input, .dark select, .dark textarea { background-color: #1e1e1e !important; color: #fff !important; border-color: #444 !important; }
        .dark .bg-gray-50, .dark .bg-gray-100, .dark .bg-gray-200 { background-color: #1e1e1e !important; color: #fff !important; }
        
        /* Regras curinga para forçar qualquer elemento com estilo inline branco a ficar escuro */
        .dark [style*="background-color: white"],
        .dark [style*="background-color: rgb(255, 255, 255)"],
        .dark [style*="background-color: #fff"],
        .dark [style*="background-color: #FFF"],
        .dark [style*="background: white"],
        .dark [style*="background: rgb(255, 255, 255)"],
        .dark [style*="background: #fff"],
        .dark [style*="background: #FFF"] {
          background-color: #121212 !important;
          color: #ffffff !important;
          border-color: #333 !important;
        }

        /* Regras curinga para clarear textos escuros definidos via estilo inline */
        .dark [style*="color: #000"], .dark [style*="color: black"], .dark [style*="color: rgb(0, 0, 0)"], 
        .dark [style*="color: #333"], .dark [style*="color: #111"], .dark [style*="color: #222"], 
        .dark [style*="color: #444"], .dark [style*="color: #555"], .dark [style*="color: #666"], 
        .dark [style*="color: #777"], .dark [style*="color: #888"],
        .dark [style*="color: #111b21"], .dark [style*="color: #111B21"], 
        .dark [style*="color: #3b4a54"], .dark [style*="color: #3B4A54"],
        .dark [style*="color: #54656f"], .dark [style*="color: #54656F"],
        .dark [style*="color: #667781"], .dark [style*="color: #8696a0"] {
          color: #ffffff !important;
        }

        /* Garante que os cards com sombras fiquem escuros */
        .dark main div[style*="box-shadow"], .dark main div[class*="shadow"] {
          background-color: #121212 !important;
          border-color: #333 !important;
          color: #fff !important;
        }

        /* Deixa todos os textos e números dos balões (Dashboard) brancos, mas PROTEGE as etiquetas coloridas da aba Usuários */
        .dark main div[style*="box-shadow"] *:not([style*="background"]):not([class*="bg-"]):not([style*="color: #00a884"]):not([style*="color: #e74c3c"]), 
        .dark main div[class*="shadow"] *:not([style*="background"]):not([class*="bg-"]):not([style*="color: #00a884"]):not([style*="color: #e74c3c"]) {
          color: #ffffff !important;
        }

        /* Garante que os cabeçalhos principais e negritos fiquem perfeitamente brancos */
        .dark main h1, .dark main h2, .dark main h3, .dark main strong, .dark main b {
          color: #ffffff !important;
        }
      `}} />
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, backgroundColor: isDarkMode ? "#000000" : "#128C7E", display: "flex", flexDirection: "column", color: "#fff", transition: "background-color 0.3s", borderRight: isDarkMode ? "1px solid #333" : "none" }}>
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
          <button onClick={toggleTheme} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.9)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Alternar tema escuro">
            {isDarkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={logout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, padding: 0 }}>Sair</button>
        </div>
      </aside>
      {/* Content */}
      <main style={{ flex: 1, overflow: "auto", backgroundColor: isDarkMode ? "#000000" : "#f0f2f5", color: isDarkMode ? "#ffffff" : "inherit", transition: "background-color 0.3s, color 0.3s" }}>
        {children}
      </main>
    </div>
  );
}
