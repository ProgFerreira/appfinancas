import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') ?? '1';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') where += ' AND ativo = 1';
    else if (ativo === '0') where += ' AND ativo = 0';
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM veiculos ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; placa: string; modelo: string; tipo: string; ano: number | null; proprietario_tipo: string; renavam: string | null; capacidade: number | null; ativo: number }[]
    >(
      `SELECT id, placa, modelo, tipo, ano, proprietario_tipo, renavam, capacidade, ativo FROM veiculos ${where} ORDER BY placa LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API veiculos GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar veículos.' }, { status: 500 });
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const placa = typeof b.placa === 'string' ? b.placa.trim() : '';
  const modelo = typeof b.modelo === 'string' ? b.modelo.trim() : '';
  const tipo = typeof b.tipo === 'string' ? b.tipo.trim() : '';
  if (!placa || !modelo || !tipo) return null;
  const ano = b.ano != null && b.ano !== '' ? parseInt(String(b.ano), 10) : null;
  const capacidade = b.capacidade != null && b.capacidade !== '' ? parseFloat(String(b.capacidade)) : null;
  return {
    placa,
    modelo,
    tipo,
    ano: Number.isInteger(ano) && ano! > 0 ? ano : null,
    proprietario_tipo: typeof b.proprietario_tipo === 'string' ? b.proprietario_tipo.trim() || 'empresa' : 'empresa',
    proprietario_id: b.proprietario_id != null && b.proprietario_id !== '' ? parseInt(String(b.proprietario_id), 10) : null,
    renavam: typeof b.renavam === 'string' ? b.renavam.trim() || null : null,
    capacidade: capacidade != null && !Number.isNaN(capacidade) ? capacidade : null,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Placa, modelo e tipo são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO veiculos (placa, modelo, tipo, ano, proprietario_tipo, proprietario_id, renavam, capacidade, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.placa as string,
        data.modelo as string,
        data.tipo as string,
        data.ano as number | null,
        data.proprietario_tipo as string,
        data.proprietario_id as number | null,
        data.renavam as string | null,
        data.capacidade as number | null,
        data.observacoes as string | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API veiculos POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar veículo.' }, { status: 500 });
  }
}
