import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_API_URL;

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  const { searchParams } = req.nextUrl;
  const params = new URLSearchParams();
  if (searchParams.get('dataInicio')) params.set('dataInicio', searchParams.get('dataInicio')!);
  if (searchParams.get('dataFim'))    params.set('dataFim',    searchParams.get('dataFim')!);
  if (searchParams.get('numero'))     params.set('numero',     searchParams.get('numero')!);
  if (searchParams.get('atendenteId')) params.set('atendenteId', searchParams.get('atendenteId')!);

  try {
    const res = await fetch(`${NESTJS_URL}/atendimento/relatorio?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Erro ao buscar relatório' }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: 'Servidor indisponível' }, { status: 503 });
  }
}
