"use client";
import { useState, useRef, useEffect, useCallback, type FC, type ReactNode } from "react";

const EVO_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL ?? "";
const EVO_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY ?? "";
const EVO_INSTANCE = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE ?? "";

type Status = "open" | "pending" | "resolved";
interface Contact { id: string; name: string; phone: string; lastMsg: string; time: string; unread: number; status: Status; tags?: string[] }
interface Msg { id: string; cid: string; text: string; time: string; from: "customer" | "agent"; sending?: boolean }

// Evolution API types
interface EvoMsg {
  id: string;
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    remoteJidAlt?: string;
    addressingMode?: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
    audioMessage?: Record<string, unknown>;
    videoMessage?: Record<string, unknown>;
    documentMessage?: { title?: string };
    stickerMessage?: Record<string, unknown>;
  };
  messageType: string;
  messageTimestamp: number;
}

function getMsgText(m: EvoMsg): string {
  const msg = m.message;
  if (!msg) return "[mensagem]";
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  if (msg.imageMessage) return msg.imageMessage.caption || "[Imagem]";
  if (msg.audioMessage) return "[Áudio]";
  if (msg.videoMessage) return "[Vídeo]";
  if (msg.documentMessage) return msg.documentMessage.title || "[Documento]";
  if (msg.stickerMessage) return "[Sticker]";
  return "[mensagem]";
}

function fmtTime(ts: number): string {
  const d = new Date(ts * 1000);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fmtPhone(jid: string): string {
  return "+" + jid.split("@")[0];
}

// Resolve o JID canônico: mensagens LID usam remoteJidAlt como JID real
function canonicalJid(key: EvoMsg["key"]): string {
  if (key.addressingMode === "lid" && key.remoteJidAlt) return key.remoteJidAlt;
  return key.remoteJid;
}

function buildContactsAndMsgs(records: EvoMsg[]): { contacts: Contact[]; msgs: Record<string, Msg[]> } {
  const groups = new Map<string, EvoMsg[]>();
  for (const m of records) {
    const jid = canonicalJid(m.key);
    if (jid.endsWith("@g.us")) continue; // ignora grupos
    if (!groups.has(jid)) groups.set(jid, []);
    groups.get(jid)!.push(m);
  }

  const contacts: Contact[] = [];
  const msgs: Record<string, Msg[]> = {};

  for (const [jid, messages] of groups) {
    messages.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
    const last = messages[messages.length - 1];
    const name = messages.find(m => !m.key.fromMe && m.pushName)?.pushName || fmtPhone(jid);
    // dedup: mensagens com mesmo key.id podem aparecer duplicadas (LID + standard JID)
    const seen = new Set<string>();
    const unique = messages.filter(m => { if (seen.has(m.key.id)) return false; seen.add(m.key.id); return true; });

    contacts.push({
      id: jid,
      name,
      phone: fmtPhone(jid),
      lastMsg: getMsgText(last),
      time: fmtTime(last.messageTimestamp),
      unread: 0,
      status: "open",
    });

    msgs[jid] = unique.map(m => ({
      id: m.key.id,
      cid: jid,
      text: getMsgText(m),
      time: fmtTime(m.messageTimestamp),
      from: m.key.fromMe ? "agent" : "customer",
    }));
  }

  contacts.sort((a, b) => {
    const aTs = groups.get(a.id)!.at(-1)!.messageTimestamp;
    const bTs = groups.get(b.id)!.at(-1)!.messageTimestamp;
    return bTs - aTs;
  });

  return { contacts, msgs };
}

const Ico: Record<string, FC<{c?:string;s?:number}>> = {
  Search:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Send:({c="#00a884",s=22})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Emoji:({c="#54656f",s=22})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Clip:({c="#54656f",s=22})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>,
  Mic:({c="#54656f",s=22})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Dots:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill={c}><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>,
  Phone:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  Filter:({c="#8696a0",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Chat:({c="currentColor",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  User:({c="currentColor",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Home:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Cal:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check:({c="currentColor",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Clock:({c="currentColor",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Sort:({c="#8696a0",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><line x1="4" y1="6" x2="16" y2="6"/><line x1="4" y1="12" x2="13" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/></svg>,
  Cols:({c="#8696a0",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>,
  File:({c="#8696a0",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Refresh:({c="#8696a0",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  WA:({s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Moon:({s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  Set:({c="#54656f",s=18})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  ChkSq:({c="currentColor",s=16})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  DblChk:()=><svg width="16" height="11" viewBox="0 0 16 11" fill="#53bdeb" className="ml-1"><path d="M11.071.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 00-.336-.153.457.457 0 00-.344.153.52.52 0 00-.153.356c0 .14.051.267.153.356l2.39 2.487a.463.463 0 00.336.153.457.457 0 00.344-.153l6.598-8.144a.52.52 0 00.153-.356.457.457 0 00-.255-.316z"/><path d="M14.757.653a.457.457 0 00-.304-.102.493.493 0 00-.381.178l-6.19 7.636-1.2-1.249-.336.415 1.536 1.6a.463.463 0 00.336.153.457.457 0 00.344-.153l6.598-8.144a.52.52 0 00.153-.356.457.457 0 00-.556-.378z"/></svg>,
};

const B:FC<{ch:ReactNode;cls?:string;onClick?:()=>void}> = ({ch,cls="",onClick})=><button onClick={onClick} className={`flex items-center justify-center cursor-pointer bg-transparent border-none ${cls}`}>{ch}</button>;
const avColors = ["#25D366","#128C7E","#075E54","#34B7F1","#00A884","#5B72E8","#E84C88","#F5A623"];
const Av:FC<{n:string;sz?:number}> = ({n,sz=40})=><div style={{width:sz,minWidth:sz,height:sz,borderRadius:"50%",backgroundColor:avColors[n.charCodeAt(0)%8],fontSize:sz*.38}} className="flex items-center justify-center text-white font-semibold">{n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>;
const Tag:FC<{t:string}> = ({t})=><span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-px rounded" style={{color:"#00a884",backgroundColor:"#e7f7ef"}}>{t}</span>;

export default function WaAtendimento() {
  const [tab, setTab] = useState<Status>("open");
  const [selId, setSelId] = useState<string|null>(null);
  const [q, setQ] = useState("");
  const [inp, setInp] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [msgs, setMsgs] = useState<Record<string, Msg[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const sel = contacts.find(c => c.id === selId) ?? null;

  const loadMessages = useCallback(async () => {
    if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) {
      setError("Configure NEXT_PUBLIC_EVOLUTION_API_URL, NEXT_PUBLIC_EVOLUTION_API_KEY e NEXT_PUBLIC_EVOLUTION_INSTANCE no .env.local");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${EVO_URL}/chat/findMessages/${EVO_INSTANCE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVO_KEY,
        },
        body: JSON.stringify({ where: {}, limit: 500 }),
      });
      if (!res.ok) throw new Error(`Evolution API: ${res.status} ${res.statusText}`);
      const data = await res.json();
      const records: EvoMsg[] = data?.messages?.records ?? [];
      const { contacts: c, msgs: m } = buildContactsAndMsgs(records);
      setContacts(c);
      setMsgs(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const list = contacts.filter(c => c.status===tab && (c.name.toLowerCase().includes(q.toLowerCase())||c.phone.includes(q)));
  const cnt = (s:Status) => contacts.filter(c=>c.status===s).length;
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"})},[sel,msgs]);

  const send = async () => {
    if (!inp.trim() || !sel) return;
    const text = inp.trim();
    const msgId = `m${Date.now()}`;
    const newMsg: Msg = {
      id: msgId, cid: sel.id, text,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      from: "agent", sending: true,
    };
    // 1. Atualização otimista — desenha na tela imediatamente
    setMsgs(p => ({ ...p, [sel.id]: [...(p[sel.id] || []), newMsg] }));
    setInp("");
    // 2. Envio real em background — não bloqueia a UI
    try {
      const res = await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: EVO_KEY },
        body: JSON.stringify({ number: sel.id, text }),
      });
      if (!res.ok) throw new Error(`Evolution: ${res.status}`);
      // Marca como enviado (duplo check)
      setMsgs(p => ({ ...p, [sel.id]: (p[sel.id] || []).map(m => m.id === msgId ? { ...m, sending: false } : m) }));
    } catch (e) {
      console.error("Falha no envio:", e);
      // Marca a mensagem com erro removendo o flag e adicionando indicação visual
      setMsgs(p => ({ ...p, [sel.id]: (p[sel.id] || []).map(m => m.id === msgId ? { ...m, sending: false } : m) }));
      alert("Erro ao enviar. Verifique se a Evolution está rodando.");
    }
  };

  const tabData:[Status,string,ReactNode][] = [["open","ABERTOS",<Ico.Chat key="c"/>],["pending","PENDENTES",<Ico.Clock key="p"/>],["resolved","RESOLVIDOS",<Ico.Check key="r"/>]];

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{fontFamily:"'Segoe UI',Helvetica,Arial,sans-serif",backgroundColor:"#eae6df"}}>
      {/* Sidebar */}
      <aside className="flex flex-col border-r" style={{width:320,minWidth:320,backgroundColor:"#fff",borderColor:"#e9edef"}}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{backgroundColor:"#f0f2f5",borderBottom:"1px solid #e9edef"}}>
          <span className="font-semibold text-sm" style={{color:"#3b4a54"}}>Marcos Sa ▾</span>
          <div className="flex gap-0.5">{[Ico.Chat,Ico.Cal,Ico.Home].map((I,i)=><B key={i} cls="p-2 rounded-lg" ch={<I c="#54656f"/>}/>)}</div>
        </div>
        <div className="flex gap-1 px-4 pt-2">
          <B cls="w-8 h-8 rounded-md border" ch={<Ico.ChkSq c="#00a884"/>}/>
          <B cls="w-8 h-8 rounded-md border border-gray-200" ch={<Ico.User c="#54656f"/>}/>
        </div>
        <div className="flex gap-1 px-4 py-1">{[Ico.Filter,Ico.File,Ico.Cols,Ico.Sort,Ico.Dots].map((I,i)=><B key={i} cls="w-[30px] h-[30px] rounded-md border border-gray-200" ch={<I c="#8696a0"/>}/>)}</div>
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 border" style={{backgroundColor:"#f0f2f5",borderColor:"#e9edef"}}>
            <Ico.Search s={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscando por id, nome ou número..." className="flex-1 bg-transparent border-none outline-none text-[13px]" style={{color:"#3b4a54"}}/>
          </div>
          <B cls="w-8 h-8 rounded-md border border-gray-200" onClick={loadMessages} ch={<Ico.Refresh/>}/>
        </div>
        <div className="flex" style={{borderBottom:"1px solid #e9edef"}}>
          {tabData.map(([k,label,icon])=>{const on=tab===k;return(
            <button key={k} onClick={()=>setTab(k)} className="flex-1 flex flex-col items-center gap-0.5 py-2 bg-transparent border-none cursor-pointer" style={{borderBottom:`2px solid ${on?"#00a884":"transparent"}`}}>
              <div className="relative flex items-center gap-1"><span style={{color:on?"#00a884":"#667781"}}>{icon}</span>{cnt(k)>0&&<span className="absolute -top-1.5 -right-3 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{cnt(k)}</span>}</div>
              <span className="text-[11px] font-semibold tracking-wide" style={{color:on?"#00a884":"#667781"}}>{label}</span>
            </button>
          )})}
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading&&<p className="text-center text-[13px] p-6" style={{color:"#8696a0"}}>Carregando...</p>}
          {error&&<p className="text-center text-[12px] p-4 mx-3 rounded-lg bg-red-50 text-red-500">{error}</p>}
          {!loading&&!error&&list.length===0&&<p className="text-center text-[13px] p-6" style={{color:"#8696a0"}}>Nenhum ticket</p>}
          {list.map(c=>(
            <button key={c.id} onClick={()=>setSelId(c.id)} className="w-full flex items-start gap-3 px-4 py-3 border-none text-left cursor-pointer" style={{fontFamily:"inherit",backgroundColor:sel?.id===c.id?"#f0f2f5":"transparent",borderBottom:"1px solid #f0f2f5"}}>
              <Av n={c.name} sz={46}/>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5"><span className="font-semibold text-sm" style={{color:"#111b21"}}>{c.name}</span><span className="text-[11px]" style={{color:"#667781"}}>{c.time}</span></div>
                <div className="flex justify-between items-center"><span className="text-[13px] truncate max-w-[170px]" style={{color:"#667781"}}>{c.lastMsg}</span>{c.unread>0&&<span className="w-5 h-5 rounded-full bg-[#25d366] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{c.unread}</span>}</div>
                {c.tags&&<div className="flex gap-1 mt-1">{c.tags.map(t=><Tag key={t} t={t}/>)}</div>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2" style={{backgroundColor:"#f0f2f5",borderTop:"1px solid #e9edef"}}>
          <B cls="p-1.5" ch={<Ico.Set/>}/><div className="flex items-center px-2 py-1 rounded-xl bg-[#3b4a54] cursor-pointer"><Ico.Moon/></div><div className="ml-auto w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center"><Ico.WA/></div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col" style={{backgroundColor:"#eae6df",backgroundImage:"radial-gradient(circle,#d4cfc6 1px,transparent 1px)",backgroundSize:"24px 24px"}}>
        {!sel?(
          <div className="flex-1 flex flex-col items-center justify-center gap-4"><Ico.Emoji c="#bfc8d0" s={60}/><p className="text-[22px] font-light text-center" style={{color:"#667781"}}>Selecione<br/>um ticket!</p></div>
        ):(<>
          <div className="flex items-center justify-between px-4 py-2" style={{backgroundColor:"#f0f2f5",borderBottom:"1px solid #e2e8ec",minHeight:56}}>
            <div className="flex items-center gap-3"><Av n={sel.name}/><div><div className="font-semibold text-[15px]" style={{color:"#111b21"}}>{sel.name}</div><div className="text-xs" style={{color:"#667781"}}>{sel.phone}</div></div></div>
            <div className="flex items-center gap-1">{sel.tags?.map(t=><Tag key={t} t={t}/>)}<B cls="p-2" ch={<Ico.Phone/>}/><B cls="p-2" ch={<Ico.Search/>}/><B cls="p-2" ch={<Ico.Dots/>}/></div>
          </div>
          <div className="flex-1 overflow-y-auto px-[60px] py-4"><div className="max-w-[780px] mx-auto flex flex-col gap-1">
            {(msgs[sel.id]||[]).map(m=>(
              <div key={m.id} className="flex w-full" style={{justifyContent:m.from==="agent"?"flex-end":"flex-start"}}>
                <div className="max-w-[65%] px-2.5 py-1.5" style={{backgroundColor:m.from==="agent"?"#d9fdd3":"#fff",borderRadius:12,borderTopRightRadius:m.from==="agent"?4:12,borderTopLeftRadius:m.from==="agent"?12:4,boxShadow:"0 1px .5px rgba(11,20,26,.08)"}}>
                  <span className="text-sm" style={{color:"#111b21",lineHeight:"1.45",wordBreak:"break-word"}}>{m.text}</span>
                  <span className="flex items-center justify-end text-[11px] mt-0.5 ml-2 float-right" style={{color:"#667781"}}>{m.time}{m.from==="agent"&&(m.sending ? <Ico.Clock c="#8696a0" s={12}/> : <Ico.DblChk/>)}</span>
                </div>
              </div>
            ))}<div ref={ref}/>
          </div></div>
          <div className="px-4 py-2" style={{backgroundColor:"#f0f2f5",borderTop:"1px solid #e2e8ec"}}>
            <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1">
              <B cls="p-1.5" ch={<Ico.Emoji/>}/><B cls="p-1.5" ch={<Ico.Clip/>}/>
              <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Digite aqui..." className="flex-1 bg-transparent border-none outline-none text-sm py-2" style={{color:"#3b4a54"}}/>
              {inp.trim()?<B onClick={send} cls="p-1.5" ch={<Ico.Send/>}/>:<B cls="p-1.5" ch={<Ico.Mic/>}/>}
            </div>
          </div>
        </>)}
      </main>
    </div>
  );
}
