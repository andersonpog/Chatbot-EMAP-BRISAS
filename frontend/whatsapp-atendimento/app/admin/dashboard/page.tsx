"use client";
import { useEffect, useState } from "react";

interface Funcionario { id: string; nome: string; email: string; role: string; active: boolean; lastSeen: string | null }

const Card = ({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 18 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#111b21", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#667781", marginTop: 4 }}>{label}</div>
    </div>
  </div>
);

const isOnline = (lastSeen: string | null) => {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < 3 * 60 * 1000; // 3 minutos
};

const OnlineDot = ({ online }: { online: boolean }) => (
  <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: online ? "#25D366" : "#ccc", display: "inline-block", marginRight: 6, flexShrink: 0 }} />
);

export default function DashboardPage() {
  const [lista, setLista] = useState<Funcionario[]>([]);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/uptime").then(r => r.json()),
    ]).then(([users, up]) => {
      setLista(users);
      setUptimeSeconds(up.segundos ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Contador local que incrementa a cada segundo
  useEffect(() => {
    const t = setInterval(() => setUptimeSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Sincroniza com backend a cada 30s e atualiza status online
  useEffect(() => {
    const t = setInterval(() => {
      fetch("/api/users").then(r => r.json()).then(setLista).catch(() => {});
      fetch("/api/uptime").then(r => r.json()).then(up => setUptimeSeconds(up.segundos ?? 0)).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const ativos    = lista.filter(u => u.active);
  const admins    = ativos.filter(u => u.role === "ADMIN");
  const atendentes = ativos.filter(u => u.role === "ATENDENTE");
  const observadores = ativos.filter(u => u.role === "OBSERVADOR");

  const onlineAtendentes  = atendentes.filter(u => isOnline(u.lastSeen));
  const onlineObservadores = observadores.filter(u => isOnline(u.lastSeen));
  const onlineAdmins      = admins.filter(u => isOnline(u.lastSeen));

  const dias = Math.floor(uptimeSeconds / 86400);
  const horas = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutos = Math.floor((uptimeSeconds % 3600) / 60);
  const segs = uptimeSeconds % 60;
  const uptimeStr = uptimeSeconds > 0
    ? `${dias}d ${String(horas).padStart(2,"0")}h ${String(minutos).padStart(2,"0")}m ${String(segs).padStart(2,"0")}s`
    : "—";

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111b21" }}>Dashboard</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667781" }}>Visão geral do sistema</p>
      </div>

      {loading ? <p style={{ color: "#8696a0" }}>Carregando...</p> : (<>

        {/* Cards de métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, maxWidth: 720, marginBottom: 32 }}>
          <Card icon="👥" value={lista.length}       label="Total de usuários"  color="#128C7E" />
          <Card icon="✅" value={ativos.length}      label="Usuários ativos"    color="#25D366" />
          <Card icon="🔑" value={admins.length}      label="Administradores"    color="#F5A623" />
          <Card icon="💬" value={atendentes.length}  label="Atendentes"         color="#5B72E8" />
          <Card icon="👁️" value={observadores.length} label="Observadores"       color="#8E44AD" />
          <Card icon="⏱️" value={uptimeStr}          label="Uptime do sistema"  color="#128C7E" />
        </div>

        {/* Painel de usuários online */}
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111b21", margin: 0 }}>Usuários online agora</h2>
            
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>

            {/* Atendentes */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#667781", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Atendentes ({onlineAtendentes.length}/{atendentes.length})
              </div>
              {atendentes.length === 0
                ? <p style={{ fontSize: 13, color: "#aaa" }}>Nenhum atendente cadastrado</p>
                : atendentes.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f2f5" }}>
                    <OnlineDot online={isOnline(u.lastSeen)} />
                    <span style={{ fontSize: 13, color: "#111b21", fontWeight: isOnline(u.lastSeen) ? 600 : 400 }}>{u.nome}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: isOnline(u.lastSeen) ? "#25D366" : "#aaa" }}>
                      {isOnline(u.lastSeen) ? "Online" : "Offline"}
                    </span>
                  </div>
                ))}
            </div>

            {/* Observadores */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#667781", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Observadores ({onlineObservadores.length}/{observadores.length})
              </div>
              {observadores.length === 0
                ? <p style={{ fontSize: 13, color: "#aaa" }}>Nenhum observador cadastrado</p>
                : observadores.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f2f5" }}>
                    <OnlineDot online={isOnline(u.lastSeen)} />
                    <span style={{ fontSize: 13, color: "#111b21", fontWeight: isOnline(u.lastSeen) ? 600 : 400 }}>{u.nome}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: isOnline(u.lastSeen) ? "#25D366" : "#aaa" }}>
                      {isOnline(u.lastSeen) ? "Online" : "Offline"}
                    </span>
                  </div>
                ))}
            </div>

            {/* Administradores */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#667781", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Administradores ({onlineAdmins.length}/{admins.length})
              </div>
              {admins.length === 0
                ? <p style={{ fontSize: 13, color: "#aaa" }}>Nenhum administrador cadastrado</p>
                : admins.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f2f5" }}>
                    <OnlineDot online={isOnline(u.lastSeen)} />
                    <span style={{ fontSize: 13, color: "#111b21", fontWeight: isOnline(u.lastSeen) ? 600 : 400 }}>{u.nome}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: isOnline(u.lastSeen) ? "#25D366" : "#aaa" }}>
                      {isOnline(u.lastSeen) ? "Online" : "Offline"}
                    </span>
                  </div>
                ))}
            </div>

            {/* Sistema / Bot */}
            <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#667781", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Sistema (1/1)
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f0f2f5" }}>
                <OnlineDot online={true} />
                <span style={{ fontSize: 16, marginRight: 6, lineHeight: 1 }}>🤖</span>
                <span style={{ fontSize: 13, color: "#111b21", fontWeight: 600 }}>Bot Ouvidoria</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#25D366" }}>
                  Online
                </span>
              </div>
            </div>

          </div>
        </div>

      </>)}
    </div>
  );
}
