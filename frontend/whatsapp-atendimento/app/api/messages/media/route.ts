import { NextRequest, NextResponse } from "next/server";

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE;

function pickBase64(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  for (const key of ["base64", "media", "data", "file", "buffer"]) {
    if (typeof record[key] === "string") return record[key] as string;
  }

  if (record.data && typeof record.data === "object") {
    return pickBase64(record.data);
  }

  return null;
}

export async function GET(req: NextRequest) {
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) {
    return NextResponse.json(
      { error: "API não configurada. Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no .env.local" },
      { status: 500 }
    );
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Informe o id da mensagem" }, { status: 400 });
  }

  try {
    const res = await fetch(`${EVO_URL}/chat/getBase64FromMediaMessage/${EVO_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVO_KEY,
      },
      body: JSON.stringify({
        message: {
          key: { id },
        },
        convertToMp4: false,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Evolution API: ${res.status} ${text}` }, { status: res.status });
    }

    const text = await res.text();
    let data: unknown = text;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    const rawBase64 = pickBase64(data);
    if (!rawBase64) {
      return NextResponse.json({ error: "Mídia não encontrada na resposta da Evolution" }, { status: 404 });
    }

    const dataUrl = rawBase64.startsWith("data:") ? rawBase64 : `data:image/jpeg;base64,${rawBase64}`;
    return NextResponse.json({ dataUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
