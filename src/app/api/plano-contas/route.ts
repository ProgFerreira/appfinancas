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
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') where += ' AND pc.ativo = 1';
    else if (ativo === '0') where += ' AND pc.ativo = 0';
    const list = await query<
      { id: number; codigo: string; nome: string; plano_pai_id: number | null; tipo_conta: string; eh_receita: number; eh_despesa: number; ativo: number; pai_codigo: string | null }[]
    >(
      `SELECT pc.id, pc.codigo, pc.nome, pc.plano_pai_id, pc.tipo_conta, pc.eh_receita, pc.eh_despesa, pc.ativo, pai.codigo AS pai_codigo
       FROM plano_contas pc
       LEFT JOIN plano_contas pai ON pai.id = pc.plano_pai_id
       ${where} ORDER BY pc.codigo`,
      params
    );
    return NextResponse.json({ success: true, data: Array.isArray(list) ? list : [] });
  } catch (e) {
    console.error('API plano-contas GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar plano de contas.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!codigo || !nome) {
      return NextResponse.json({ success: false, error: 'Código e nome são obrigatórios.' }, { status: 400 });
    }
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() || null : null;
    const planoPaiId = body.plano_pai_id != null && body.plano_pai_id !== '' ? parseInt(String(body.plano_pai_id), 10) : null;
    const tipoConta = typeof body.tipo_conta === 'string' && ['sintetica', 'analitica'].includes(body.tipo_conta) ? body.tipo_conta : 'analitica';
    const ehReceita = body.eh_receita === true || body.eh_receita === 1 ? 1 : 0;
    const ehDespesa = body.eh_despesa === true || body.eh_despesa === 1 ? 1 : 0;
    const ativo = body.ativo === false || body.ativo === 0 ? 0 : 1;
    const classificacaoIdBody = body.classificacao_id != null && body.classificacao_id !== '' ? parseInt(String(body.classificacao_id), 10) : null;
    const grupoDreIdBody = body.grupo_dre_id != null && body.grupo_dre_id !== '' ? parseInt(String(body.grupo_dre_id), 10) : null;
    const naturezaFluxoIdBody = body.natureza_fluxo_id != null && body.natureza_fluxo_id !== '' ? parseInt(String(body.natureza_fluxo_id), 10) : null;

    let cid: number; let gid: number; let nid: number;
    if (Number.isInteger(classificacaoIdBody) && classificacaoIdBody! > 0 && Number.isInteger(grupoDreIdBody) && grupoDreIdBody! > 0 && Number.isInteger(naturezaFluxoIdBody) && naturezaFluxoIdBody! > 0) {
      const grupoCheck = await query<{ classificacao_id: number }[]>(
        'SELECT classificacao_id FROM plano_contas_grupos WHERE id = ? LIMIT 1',
        [grupoDreIdBody]
      );
      const g = Array.isArray(grupoCheck) ? grupoCheck[0] : null;
      if (g && g.classificacao_id === classificacaoIdBody) {
        cid = classificacaoIdBody!;
        gid = grupoDreIdBody!;
        nid = naturezaFluxoIdBody!;
      } else {
        const defaults = await query<{ cid: number; gid: number; nid: number }[]>(
          `SELECT (SELECT id FROM plano_contas_classificacoes LIMIT 1) AS cid, (SELECT id FROM plano_contas_grupos LIMIT 1) AS gid, (SELECT id FROM plano_contas_naturezas LIMIT 1) AS nid`
        );
        const d = Array.isArray(defaults) && defaults[0] ? defaults[0] : null;
        if (!d || !d.cid || !d.gid || !d.nid) return NextResponse.json({ success: false, error: 'Configure classificações/grupos/naturezas do plano de contas no banco.' }, { status: 400 });
        cid = d.cid; gid = d.gid; nid = d.nid;
      }
    } else {
      const defaults = await query<{ cid: number; gid: number; nid: number }[]>(
        `SELECT (SELECT id FROM plano_contas_classificacoes LIMIT 1) AS cid, (SELECT id FROM plano_contas_grupos LIMIT 1) AS gid, (SELECT id FROM plano_contas_naturezas LIMIT 1) AS nid`
      );
      const d = Array.isArray(defaults) && defaults[0] ? defaults[0] : null;
      if (!d || !d.cid || !d.gid || !d.nid) return NextResponse.json({ success: false, error: 'Configure classificações/grupos/naturezas do plano de contas no banco.' }, { status: 400 });
      cid = d.cid; gid = d.gid; nid = d.nid;
    }
    await query(
      `INSERT INTO plano_contas (codigo, nome, descricao, plano_pai_id, tipo_conta, classificacao_id, grupo_dre_id, natureza_fluxo_id, eh_receita, eh_despesa, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, nome, descricao, planoPaiId, tipoConta, cid, gid, nid, ehReceita, ehDespesa, ativo]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API plano-contas POST:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Duplicate') || msg.includes('uq_plano_contas_codigo')) {
      return NextResponse.json({ success: false, error: 'Código já existe no plano de contas.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erro ao criar conta.' }, { status: 500 });
  }
}
