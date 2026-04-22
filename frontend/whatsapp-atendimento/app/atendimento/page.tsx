"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import WaAtendimento from "../../AtendimentoWhatsapp";

export default function AtendimentoPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.role) setUserRole(data.role);
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {userRole === "ADMIN" && (
        <div style={{ padding: "6px 16px", backgroundColor: "#128C7E", display: "flex", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", zIndex: 10 }}>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>⬅</span> Voltar para o Dashboard
          </button>
        </div>
      )}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <WaAtendimento />
      </div>
    </div>
  );
}
