"use client";
import { useState, useEffect } from "react";

interface Funcionario {
  id: string; nome: string; email: string; role: string; active: boolean; createdAt: string;
}

export default function UsuariosPage() {
  const [lista, setLista] = useState<Funcionario[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal criar
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "ATENDENTE" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Modal editar
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", role: "ATENDENTE" });
  const [editErro, setEditErro] = useState("");
  const [editSalvando, setEditSalvando] = useState(false);

  const filtrados = lista.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.email.toLowerCase().includes(busca.toLowerCase())
  );

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

  const abrirEditar = (f: Funcionario) => {
    setEditando(f);
    setEditForm({ nome: f.nome, role: f.role });
    setEditErro("");
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setEditErro(""); setEditSalvando(true);
    const res = await fetch(`/api/users/${editando.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) { setEditErro(data.error || "Erro ao atualizar"); setEditSalvando(false); return; }
    setEditando(null);
    carregar();
    setEditSalvando(false);
  };

  const toggleAtivo = async (f: Funcionario) => {
    const acao = f.active ? "desativar" : "reativar";
    if (!confirm(`Deseja ${acao} o usuário ${f.nome}?`)) return;
    await fetch(`/api/users/${f.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !f.active }),
    });
    carregar();
  };

  const inp = (field: string, formObj: typeof form, setFormObj: React.Dispatch<React.SetStateAction<typeof form>>) => ({
    value: formObj[field as keyof typeof form],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormObj(p => ({ ...p, [field]: e.target.value })),
    style: { width: "100%", padding: "9px 12px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, boxSizing: "border-box" as const, color: "#111b21" }
  });

  const roleLabel = (r: string) => {
    if (r === "ADMIN") return <span style={{ background: "#e7f7ef", color: "#00a884", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>ADMIN</span>;
    if (r === "OBSERVADOR") return <span style={{ background: "#f3e8ff", color: "#8e44ad", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>OBSERVADOR</span>;
    return <span style={{ background: "#e8efff", color: "#5b72e8", padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>ATENDENTE</span>;
  };

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, boxSizing: "border-box" as const, color: "#111b21" };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111b21" }}>Usuários</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667781" }}>Gerenciar acesso ao sistema</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: "10px 20px", backgroundColor: "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + Novo usuário
        </button>
      </div>

      <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail..."
        style={{ width: 320, padding: "9px 14px", border: "1.5px solid #e9edef", borderRadius: 8, fontSize: 14, outline: "none", marginBottom: 16, color: "#3b4a54" }} />

      <div style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: 40, color: "#8696a0" }}>Carregando...</p>
        ) : filtrados.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: "#8696a0" }}>Nenhum usuário encontrado.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f2f5" }}>
                {["Nome", "E-mail", "Perfil", "Status", "Ações"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#667781", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((f) => (
                <tr key={f.id} style={{ borderTop: "1px solid #f0f2f5", opacity: f.active ? 1 : 0.55 }}>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#111b21" }}>{f.nome}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "#3b4a54" }}>{f.email}</td>
                  <td style={{ padding: "14px 16px" }}>{roleLabel(f.role)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    {f.active
                      ? <span style={{ background: "#e7f7ef", color: "#00a884", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Ativo</span>
                      : <span style={{ background: "#fdecea", color: "#e74c3c", padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>Inativo</span>
                    }
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => abrirEditar(f)}
                        style={{ padding: "4px 12px", border: "1.5px solid #128C7E", borderRadius: 6, background: "transparent", color: "#128C7E", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                        Editar
                      </button>
                      <button onClick={() => toggleAtivo(f)}
                        style={{ padding: "4px 12px", border: `1.5px solid ${f.active ? "#e74c3c" : "#25D366"}`, borderRadius: 6, background: "transparent", color: f.active ? "#e74c3c" : "#25D366", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                        {f.active ? "Desativar" : "Reativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Criar */}
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
                  <input type={type} required {...inp(field, form, setForm)} />
                </div>
              ))}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>Perfil</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, backgroundColor: "#fff" }}>
                  <option value="ATENDENTE">Atendente</option>
                  <option value="OBSERVADOR">Observador</option>
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

      {/* Modal Editar */}
      {editando && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 28, width: 400, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#111b21" }}>Editar Usuário</h2>
            <form onSubmit={salvarEdicao}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>Nome</label>
                <input type="text" required value={editForm.nome}
                  onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))}
                  style={inputStyle} />
              </div>
              <div style={{ marginBottom: 6 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>E-mail</label>
                <input type="text" value={editando.email} disabled
                  style={{ ...inputStyle, backgroundColor: "#f0f2f5", color: "#8696a0" }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#3b4a54", marginBottom: 5 }}>Perfil</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                  style={{ ...inputStyle, backgroundColor: "#fff" }}>
                  <option value="ATENDENTE">Atendente</option>
                  <option value="OBSERVADOR">Observador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              {editErro && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{editErro}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setEditando(null)}
                  style={{ flex: 1, padding: 10, backgroundColor: "#f0f2f5", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#3b4a54" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={editSalvando}
                  style={{ flex: 1, padding: 10, backgroundColor: editSalvando ? "#75bfb8" : "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: editSalvando ? "not-allowed" : "pointer" }}>
                  {editSalvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
