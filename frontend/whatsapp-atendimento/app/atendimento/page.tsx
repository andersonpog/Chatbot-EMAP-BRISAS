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
      {}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <WaAtendimento />
      </div>
    </div>
  );
}
