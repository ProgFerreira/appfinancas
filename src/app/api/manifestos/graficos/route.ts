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
    const rawInicio = searchParams.get('data_inicio')?.trim() ?? '';
    const rawFim = searchParams.get('data_fim')?.trim() ?? '';
    const motoristaId = parseInt(searchParams.get('motorista_id') ?? '0', 10) || 0;
    const tipoServico = searchParams.get('tipo_servico')?.trim() ?? '';
    const placa = searchParams.get('placa')?.trim() ?? '';
    const toYyyyMmDd = (s: string): string => {
      if (!s) return '';
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
      const parts = s.split('/').map((p) => p.padStart(2, '0'));
      if (parts.length === 3 && parts[2]!.length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return s;
    };
    let dataInicio = toYyyyMmDd(rawInicio);
    let dataFim = toYyyyMmDd(rawFim);

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ success: false, error: 'data_inicio e data_fim são obrigatórios.' }, { status: 400 });
    }
    if (dataInicio > dataFim) {
      [dataInicio, dataFim] = [dataFim, dataInicio];
    }

    const conditions: string[] = ['m.data_manifesto IS NOT NULL', 'DATE(m.data_manifesto) >= ?', 'DATE(m.data_manifesto) <= ?'];
    const params: (string | number)[] = [dataInicio, dataFim];
    if (motoristaId > 0) {
      conditions.push('m.motorista_id = ?');
      params.push(motoristaId);
    }
    if (tipoServico) {
      conditions.push('m.tipo_servico = ?');
      params.push(tipoServico);
    }
    if (placa) {
      conditions.push('mot.placa = ?');
      params.push(placa);
    }
    const join = 'LEFT JOIN motoristas mot ON mot.id = m.motorista_id';
    let where = conditions.join(' AND ');
    let runParams: (string | number)[] = [...params];
    try {
      await query<{ n: number }[]>(`SELECT 1 AS n FROM manifestos m ${join} WHERE ${where} LIMIT 1`, runParams);
    } catch {
      where = conditions.filter((c) => !c.includes('mot.placa')).join(' AND ');
      runParams = placa ? params.slice(0, -1) : [...params];
    }

    let porData: { data: string; total: number; total_frete: number; total_liquido: number }[] = [];
    let porMotorista: { motorista_nome: string | null; total_frete: number; total_liquido: number }[] = [];
    try {
      const porDataRows = await query<{ data: string; total: number; total_frete: number; total_liquido: number }[]>(
        `SELECT DATE(m.data_manifesto) AS data, COUNT(*) AS total,
                COALESCE(SUM(m.valor_frete), 0) AS total_frete,
                COALESCE(SUM(m.valor_liquido), 0) AS total_liquido
         FROM manifestos m ${join} WHERE ${where}
         GROUP BY DATE(m.data_manifesto) ORDER BY data`,
        runParams
      );
      porData = Array.isArray(porDataRows) ? porDataRows : [];
    } catch {
      porData = [];
    }
    try {
      const porMotoristaRows = await query<{ motorista_nome: string | null; total_frete: number; total_liquido: number }[]>(
        `SELECT mot.nome AS motorista_nome,
                COALESCE(SUM(m.valor_frete), 0) AS total_frete,
                COALESCE(SUM(m.valor_liquido), 0) AS total_liquido
         FROM manifestos m ${join} WHERE ${where}
         GROUP BY m.motorista_id, mot.nome ORDER BY total_liquido DESC`,
        runParams
      );
      porMotorista = Array.isArray(porMotoristaRows) ? porMotoristaRows : [];
    } catch {
      porMotorista = [];
    }

    return NextResponse.json({
      success: true,
      data: { porData, porMotorista },
    });
  } catch (e) {
    console.error('API manifestos/graficos GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar gráficos.', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
