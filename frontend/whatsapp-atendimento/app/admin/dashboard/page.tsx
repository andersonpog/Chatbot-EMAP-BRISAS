"use client";
import { useEffect, useState } from "react";

interface Stats { total: number; ativos: number; admins: number; atendentes: number }

const Card = ({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) => (
  <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 18 }}>
    <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#111b21", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#667781", marginTop: 4 }}>{label}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, ativos: 0, admins: 0, atendentes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then((lista: { role: string; active: boolean }[]) => {
      setStats({
        total: lista.length,
        ativos: lista.filter(u => u.active).length,
        admins: lista.filter(u => u.role === "ADMIN").length,
        atendentes: lista.filter(u => u.role === "ATENDENTE").length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111b21" }}>Dashboard</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667781" }}>Visão geral do sistema</p>
      </div>

      {loading ? (
        <p style={{ color: "#8696a0" }}>Carregando...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, maxWidth: 720 }}>
          <Card icon="👥" value={stats.total} label="Total de usuários" color="#128C7E" />
          <Card icon="✅" value={stats.ativos} label="Usuários ativos" color="#25D366" />
          <Card icon="🔑" value={stats.admins} label="Administradores" color="#F5A623" />
          <Card icon="💬" value={stats.atendentes} label="Atendentes" color="#5B72E8" />
        </div>
      )}
    </div>
  );
}
