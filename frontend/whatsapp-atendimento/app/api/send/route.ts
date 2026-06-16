import { NextRequest, NextResponse } from "next/server";

const EVO_URL = process.env.EVOLUTION_API_URL;
const EVO_KEY = process.env.EVOLUTION_API_KEY;
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE;
const NESTJS_URL = process.env.NESTJS_API_URL;

export async function POST(req: NextRequest) {
  if (!EVO_URL || !EVO_KEY || !EVO_INSTANCE) {
    return NextResponse.json(
      { error: "API não configurada. Defina EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE no .env.local" },
      { status: 500 }
    );
  }

  const { number, text, remetente, media } = await req.json();

  try {
    const isMedia = media?.base64 && media?.mimetype;
    const endpoint = isMedia
      ? `${EVO_URL}/message/sendMedia/${EVO_INSTANCE}`
      : `${EVO_URL}/message/sendText/${EVO_INSTANCE}`;
    const payload = isMedia
      ? {
          number,
          mediatype: "image",
          mimetype: media.mimetype,
          caption: text || "",
          media: media.base64,
          fileName: media.fileName || "imagem.jpg",
          delay: 1200,
          linkPreview: false,
          options: {
            presence: "composing",
            checkContact: false,
            forceSend: true,
          },
        }
      : {
          number,
          text,
          delay: 1200,
          linkPreview: false,
          options: {
            presence: "composing",
            checkContact: false,
            forceSend: true,
          },
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `Evolution: ${res.status} ${body}` }, { status: res.status });
    }

    const data = await res.json();

    if (NESTJS_URL) {
      await fetch(`${NESTJS_URL}/webhook/notify-message-sent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, text, remetente: remetente ?? null }),
      }).catch(() => {});
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
