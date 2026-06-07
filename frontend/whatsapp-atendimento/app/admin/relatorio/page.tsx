"use client";
import React, { useState, useEffect, useRef } from "react";

interface Mensagem {
  id: number;
  fromMe: boolean;
  conteudo: string;
  remetente: string | null;
  dataEnvio: string;
  tipo: string;
}

interface RegistroRelatorio {
  id: number;
  remoteJid: string;
  nome: string;
  status: string;
  atendenteId: string | null;
  atendenteNome: string | null;
  dataCriacao: string;
  mensagens: Mensagem[];
}

interface Atendente { id: string; nome: string }

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const statusColor: Record<string, string> = {
  FINALIZADO:    '#25D366',
  EM_ATENDIMENTO:'#3b82f6',
  AGUARDANDO:    '#f59e0b',
  BOT:           '#8b5cf6',
};

function numLimpo(remoteJid: string) {
  return remoteJid.replace(/@.*/, '').replace(/\D/g, '');
}

function numFormatado(remoteJid: string) {
  const n = numLimpo(remoteJid);
  if (n.length >= 12) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  return n;
}

export default function RelatorioPage() {
  const hoje = new Date().toISOString().slice(0, 10);
  const [dataInicio, setDataInicio] = useState(hoje);
  const [dataFim, setDataFim]       = useState(hoje);
  const [numero, setNumero]         = useState('');
  const [atendenteId, setAtendenteId] = useState('');
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [registros, setRegistros]   = useState<RegistroRelatorio[]>([]);
  const [expandido, setExpandido]   = useState<Record<number, boolean>>({});
  const [loading, setLoading]       = useState(false);
  const [gerado, setGerado]         = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then((users: any[]) => {
      setAtendentes(users.filter(u => u.role === 'ATENDENTE' || u.role === 'ADMIN'));
    }).catch(() => {});
  }, []);

  const buscar = async () => {
    if (!dataInicio || !dataFim) return;
    setLoading(true);
    try {
      const p = new URLSearchParams({ dataInicio, dataFim });
      if (numero)     p.set('numero', numero);
      if (atendenteId) p.set('atendenteId', atendenteId);
      const res = await fetch(`/api/relatorio?${p.toString()}`);
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
      setExpandido({});
      setGerado(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) =>
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));

  const imprimir = () => {
    const style = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .sub { font-size: 11px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #128C7E; color: #fff; padding: 6px 8px; text-align: left; font-size: 11px; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; vertical-align: top; }
        .conversa { background: #f9f9f9; padding: 8px; border-radius: 4px; margin-top: 6px; }
        .msg { margin-bottom: 4px; }
        .msg-cliente { color: #111; }
        .msg-bot { color: #128C7E; font-style: italic; }
        .hora { font-size: 10px; color: #888; margin-left: 6px; }
        @media print { button { display: none; } }
      </style>`;

    const rows = registros.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.atendenteNome || '—'}</td>
        <td>${r.nome}<br/><span style="color:#667781">${numFormatado(r.remoteJid)}</span></td>
        <td>${fmt(r.dataCriacao)}</td>
        <td>
          <span style="color:${statusColor[r.status] || '#888'}">${r.status}</span>
          <div class="conversa">
            ${r.mensagens.length === 0
              ? '<em style="color:#aaa">Sem mensagens registradas</em>'
              : r.mensagens.map(m => `
                  <div class="msg ${m.fromMe ? 'msg-bot' : 'msg-cliente'}">
                    <strong>${m.fromMe ? (m.remetente || 'Atendente') : (m.remetente || r.nome)}:</strong>
                    ${m.conteudo}
                    <span class="hora">${fmtHora(m.dataEnvio)}</span>
                  </div>`).join('')}
          </div>
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><title>Relatório EMAP</title>${style}</head><body>
      <h1>Relatório de Atendimentos — EMAP</h1>
      <div class="sub">Período: ${dataInicio} a ${dataFim} &nbsp;|&nbsp; Total: ${registros.length} atendimentos</div>
      <table>
        <thead><tr><th>ID</th><th>Atendente</th><th>Cliente / Número</th><th>Data</th><th>Status / Conversa</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const totalMensagens = registros.reduce((acc, r) => acc + r.mensagens.length, 0);

  return (
    <div style={{ padding: 32, maxWidth: 1200 }}>
      {/* Cabeçalho */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111b21" }}>Relatórios</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#667781" }}>Histórico de atendimentos e conversas</p>
      </div>

      {/* Filtros */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#667781", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Filtros
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667781", marginBottom: 4 }}>Data início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667781", marginBottom: 4 }}>Data fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667781", marginBottom: 4 }}>Número WhatsApp</label>
            <input type="text" placeholder="Ex: 5598912345678" value={numero} onChange={e => setNumero(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: 200, outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#667781", marginBottom: 4 }}>Atendente</label>
            <select value={atendenteId} onChange={e => setAtendenteId(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, minWidth: 160, outline: "none" }}>
              <option value="">Todos</option>
              <option value="bot">🤖 Bot Ouvidoria</option>
              {atendentes.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <button onClick={buscar} disabled={loading}
            style={{ padding: "8px 24px", backgroundColor: "#128C7E", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
            {loading ? "Buscando..." : "Gerar Relatório"}
          </button>
          {gerado && registros.length > 0 && (
            <button onClick={imprimir}
              style={{ padding: "8px 20px", backgroundColor: "#fff", color: "#128C7E", border: "1px solid #128C7E", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              🖨️ Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      {gerado && (
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Atendimentos", value: registros.length, color: "#128C7E" },
            { label: "Total de mensagens", value: totalMensagens, color: "#5B72E8" },
            { label: "Finalizados", value: registros.filter(r => r.status === 'FINALIZADO').length, color: "#25D366" },
            { label: "Com conversa", value: registros.filter(r => r.mensagens.length > 0).length, color: "#f59e0b" },
          ].map(c => (
            <div key={c.label} style={{ backgroundColor: "#fff", borderRadius: 12, padding: "16px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 12, minWidth: 160 }}>
              <div style={{ width: 8, height: 36, borderRadius: 4, backgroundColor: c.color }} />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#111b21", lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: "#667781", marginTop: 2 }}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {gerado && (
        <div ref={printRef} style={{ backgroundColor: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
          {registros.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#8696a0", fontSize: 14 }}>
              Nenhum atendimento encontrado para o período selecionado.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#128C7E", color: "#fff" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, width: 60 }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Atendente</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Cliente / Número</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Data</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600 }}>Msgs</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, fontWeight: 600 }}>Conversa</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r, idx) => (
                  <React.Fragment key={r.id}>
                    <tr style={{ borderBottom: "1px solid #f0f2f5", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#667781", fontWeight: 600 }}>#{r.id}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#111b21" }}>
                        {r.atendenteNome || <span style={{ color: "#aaa" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111b21" }}>{r.nome}</div>
                        <div style={{ fontSize: 11, color: "#667781", marginTop: 2 }}>{numFormatado(r.remoteJid)}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#667781", whiteSpace: "nowrap" }}>
                        {fmt(r.dataCriacao)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[r.status] || "#888", backgroundColor: (statusColor[r.status] || "#888") + "18", padding: "3px 8px", borderRadius: 12 }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 13, color: "#667781" }}>
                        {r.mensagens.length}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button onClick={() => toggleExpand(r.id)}
                          style={{ padding: "4px 12px", backgroundColor: expandido[r.id] ? "#f0f2f5" : "#128C7E", color: expandido[r.id] ? "#128C7E" : "#fff", border: expandido[r.id] ? "1px solid #128C7E" : "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                          {expandido[r.id] ? "Fechar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                    {expandido[r.id] && (
                      <tr style={{ backgroundColor: "#f7faf9" }}>
                        <td colSpan={7} style={{ padding: "0 16px 16px 48px" }}>
                          <div style={{ borderLeft: "3px solid #128C7E", paddingLeft: 16, marginTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#128C7E", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Histórico da conversa — {r.mensagens.length} mensagem(ns)
                            </div>
                            {r.mensagens.length === 0 ? (
                              <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>Nenhuma mensagem registrada neste atendimento.</p>
                            ) : (
                              r.mensagens.map(m => (
                                <div key={m.id} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                                  <div style={{ minWidth: 52, fontSize: 10, color: "#8696a0", paddingTop: 2, whiteSpace: "nowrap" }}>
                                    {fmtHora(m.dataEnvio)}
                                  </div>
                                  <div style={{ flex: 1, backgroundColor: m.fromMe ? "#dcf8c6" : "#fff", border: `1px solid ${m.fromMe ? "#b2dfb2" : "#e5e7eb"}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, color: "#111b21", maxWidth: 600 }}>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: m.fromMe ? "#128C7E" : "#667781", marginBottom: 2 }}>
                                      {m.fromMe ? (m.remetente || "Atendente / Bot") : (m.remetente || r.nome)}
                                    </div>
                                    {m.conteudo}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!gerado && (
        <div style={{ backgroundColor: "#fff", borderRadius: 12, padding: 48, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", textAlign: "center", color: "#8696a0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111b21", marginBottom: 4 }}>Nenhum relatório gerado</div>
          <div style={{ fontSize: 13 }}>Selecione o período e clique em "Gerar Relatório"</div>
        </div>
      )}
    </div>
  );
}
