import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';

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
    if (ativo === '1') where += ' AND m.ativo = 1';
    else if (ativo === '0') where += ' AND m.ativo = 0';
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM motoristas m ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; nome: string; cpf: string; telefone: string | null; email: string | null; tipo_vinculo: string; ativo: number; parceiro_nome: string | null; veiculos_count: number }[]
    >(
      `SELECT m.id, m.nome, m.cpf, m.telefone, m.email, m.tipo_vinculo, m.ativo, c.nome AS parceiro_nome,
              (SELECT COUNT(*) FROM veiculos v WHERE v.proprietario_tipo = 'motorista' AND v.proprietario_id = m.id AND v.ativo = 1) AS veiculos_count
       FROM motoristas m
       LEFT JOIN clientes c ON c.id = m.parceiro_id
       ${where} ORDER BY m.nome LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API motoristas GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar motoristas.' }, { status: 500 });
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const cpf = typeof b.cpf === 'string' ? b.cpf.trim() : '';
  const tipoVinculo = typeof b.tipo_vinculo === 'string' ? b.tipo_vinculo.trim() : '';
  if (!nome || !cpf || !tipoVinculo) return null;
  const parceiroId = b.parceiro_id != null && b.parceiro_id !== '' ? parseInt(String(b.parceiro_id), 10) : null;
  return {
    parceiro_id: Number.isInteger(parceiroId) && parceiroId! > 0 ? parceiroId : null,
    nome,
    cpf,
    telefone: typeof b.telefone === 'string' ? b.telefone.trim() || null : null,
    email: typeof b.email === 'string' ? b.email.trim() || null : null,
    tipo_vinculo: tipoVinculo,
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
      return NextResponse.json({ success: false, error: 'Nome, CPF e tipo de vínculo são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO motoristas (parceiro_id, nome, cpf, telefone, email, tipo_vinculo, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.parceiro_id as number | null,
        data.nome as string,
        data.cpf as string,
        data.telefone as string | null,
        data.email as string | null,
        data.tipo_vinculo as string,
        data.observacoes as string | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API motoristas POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar motorista.' }, { status: 500 });
  }
}
