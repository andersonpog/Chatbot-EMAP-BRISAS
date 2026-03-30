"use client";
import { useState, useEffect } from "react";

interface Funcionario {
  id: string; nome: string; email: string; role: string; createdAt: string;
}

export default function UsuariosPage() {
  const [lista, setLista] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "ATENDENTE" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setLista(await res.json());
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setSalvando(true);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setErro(data.error || "Erro ao criar usuário"); setSalvando(false); return; }
    setModal(false);
    setForm({ nome: "", email: "", senha: "", role: "ATENDENTE" });
    carregar();
    setSalvando(false);
  };

  const inp = (field: string) => ({
    value: form[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [field]: e.target.value })),
    style: { width: "100%", padding: "9px 12px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, boxSizing: "border-box" as const, color: "#111b21" }
  });

  const roleLabel = (r: string) => r === "ADMIN"
    ? <span style={{ background: "#e7f7ef", color: "#00a884", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>ADMIN</span>
    : <span style={{ background: "#f0f2f5", color: "#667781", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>ATENDENTE</span>;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111b21" }}>Usuários</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667781" }}>{lista.length} funcionário(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: "10px 20px", backgroundColor: "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + Novo Usuário
        </button>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: 40, color: "#8696a0" }}>Carregando...</p>
        ) : lista.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: "#8696a0" }}>Nenhum usuário cadastrado.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f2f5" }}>
                {["Nome", "E-mail", "Perfil", "Cadastrado em"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#667781", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((f, i) => (
                <tr key={f.id} style={{ borderTop: "1px solid #f0f2f5", backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 500, color: "#111b21" }}>{f.nome}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "#3b4a54" }}>{f.email}</td>
                  <td style={{ padding: "14px 16px" }}>{roleLabel(f.role)}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#8696a0" }}>
                    {new Date(f.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 28, width: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#111b21" }}>Novo Usuário</h2>
            <form onSubmit={salvar}>
              {[
                { label: "Nome", field: "nome", type: "text" },
                { label: "E-mail", field: "email", type: "email" },
                { label: "Senha", field: "senha", type: "password" },
              ].map(({ label, field, type }) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>{label}</label>
                  <input type={type} required {...inp(field)} />
                </div>
              ))}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>Perfil</label>
                <select {...inp("role")} style={{ ...inp("role").style, backgroundColor: "#fff" }}>
                  <option value="ATENDENTE">Atendente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              {erro && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{erro}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => { setModal(false); setErro(""); }}
                  style={{ flex: 1, padding: 10, backgroundColor: "#f0f2f5", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#3b4a54" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  style={{ flex: 1, padding: 10, backgroundColor: salvando ? "#75bfb8" : "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: salvando ? "not-allowed" : "pointer" }}>
                  {salvando ? "Salvando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
