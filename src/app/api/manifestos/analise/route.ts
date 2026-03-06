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
    const rawInicio = searchParams.get('data_inicio')?.trim() ?? '';
    const rawFim = searchParams.get('data_fim')?.trim() ?? '';

    /** Normaliza para YYYY-MM-DD (MySQL). Aceita YYYY-MM-DD ou DD/MM/YYYY (dia/mês/ano). */
    const toYyyyMmDd = (s: string): string => {
      if (!s) return '';
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
      const parts = s.split('/').map((p) => p.padStart(2, '0'));
      if (parts.length === 3 && parts[2]!.length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return s;
    };
    let dataInicio = toYyyyMmDd(rawInicio);
    let dataFim = toYyyyMmDd(rawFim);
    const isValidYmd = (s: string) => /^\d{4}-\d{1,2}-\d{1,2}$/.test(s);
    if (!isValidYmd(dataInicio)) dataInicio = '';
    if (!isValidYmd(dataFim)) dataFim = '';

    const motoristaId = searchParams.get('motorista_id') ? parseInt(searchParams.get('motorista_id')!, 10) : 0;
    const tipoServico = searchParams.get('tipo_servico')?.trim() ?? '';
    const placa = searchParams.get('placa')?.trim() ?? '';
    const limiteManifestos = searchParams.get('limite_manifestos');
    const limitNum = limiteManifestos === 'todos' ? 999999 : Math.min(500, Math.max(10, parseInt(limiteManifestos ?? '30', 10)));

    let dataInicioFinal = dataInicio;
    let dataFimFinal = dataFim;
    if (dataInicio && dataFim && dataInicio > dataFim) {
      dataInicioFinal = dataFim;
      dataFimFinal = dataInicio;
    }
    const filtroPorData = Boolean(dataInicioFinal && dataFimFinal);

    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];
    if (filtroPorData) {
      conditions.push('m.data_manifesto IS NOT NULL', 'DATE(m.data_manifesto) >= ?', 'DATE(m.data_manifesto) <= ?');
      params.push(dataInicioFinal, dataFimFinal);
    }
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

    type AnaliseRow = { total_manifestos: number; total_frete: number; total_despesa: number; total_custo: number; total_liquido: number };
    type TopRow = { id: number; numero_manifesto: string; data_manifesto: string | null; motorista_nome: string | null; rota: string | null; responsavel: string | null; valor_frete: number; valor_despesa: number; valor_liquido: number; custo_adicional: number; custo_pedagio: number; lucro: number };

    let where = conditions.join(' AND ');
    let runParams: (string | number)[] = [...params];
    try {
      await query<{ n: number }[]>(`SELECT 1 AS n FROM manifestos m ${join} WHERE ${where} LIMIT 1`, runParams);
    } catch {
      where = conditions.filter((c) => !c.includes('mot.placa')).join(' AND ');
      runParams = placa ? params.slice(0, -1) : [...params];
    }

    // total_custo: usa coluna custo_total da planilha quando existir, senão soma valor_despesa + custo_adicional + custo_pedagio
    let analiseRows: AnaliseRow[] | null = null;
    try {
      analiseRows = await query<AnaliseRow[]>(
        `SELECT
          COUNT(*) AS total_manifestos,
          COALESCE(SUM(m.valor_frete), 0) AS total_frete,
          COALESCE(SUM(m.valor_despesa), 0) AS total_despesa,
          COALESCE(SUM(COALESCE(m.custo_total, (COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)))), 0) AS total_custo,
          COALESCE(SUM(m.valor_liquido), 0) AS total_liquido
         FROM manifestos m ${join} WHERE ${where}`,
        runParams
      );
    } catch {
      analiseRows = await query<AnaliseRow[]>(
        `SELECT
          COUNT(*) AS total_manifestos,
          COALESCE(SUM(m.valor_frete), 0) AS total_frete,
          COALESCE(SUM(m.valor_despesa), 0) AS total_despesa,
          COALESCE(SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)), 0) AS total_custo,
          COALESCE(SUM(m.valor_liquido), 0) AS total_liquido
         FROM manifestos m ${join} WHERE ${where}`,
        runParams
      );
    }
    const a = Array.isArray(analiseRows) && analiseRows[0] ? analiseRows[0] : null;
    const totalFrete = a ? Number(a.total_frete) : 0;
    const totalLiquido = a ? Number(a.total_liquido) : 0;

    let totalMotoristas = 0;
    try {
      const motRows = await query<{ total_motoristas: number }[]>(
        `SELECT COUNT(DISTINCT m.motorista_id) AS total_motoristas FROM manifestos m ${join} WHERE ${where}`,
        runParams
      );
      totalMotoristas = Array.isArray(motRows) && motRows[0] ? Number(motRows[0].total_motoristas) : 0;
    } catch {
      totalMotoristas = 0;
    }

    const analiseGeral = {
      total_manifestos: a ? Number(a.total_manifestos) : 0,
      total_motoristas: totalMotoristas,
      total_frete: totalFrete,
      custo_total: a ? Number(a.total_custo) : 0,
      total_liquido: totalLiquido,
      margem_media: totalFrete > 0 ? Math.round((totalLiquido / totalFrete) * 10000) / 100 : 0,
    };

    type TopRowWithTipo = TopRow & { tipo_servico?: string | null };
    let topManifestos: TopRowWithTipo[] = [];
    try {
      const topRows = await query<TopRowWithTipo[]>(
        `SELECT m.id, m.numero_manifesto, m.data_manifesto, m.tipo_servico, mot.nome AS motorista_nome,
                m.rota, m.responsavel,
                m.valor_frete, m.valor_despesa, m.valor_liquido, m.custo_adicional, m.custo_pedagio,
                (COALESCE(m.valor_liquido, 0) - COALESCE(m.valor_despesa, 0) - COALESCE(m.custo_adicional, 0) - COALESCE(m.custo_pedagio, 0)) AS lucro
         FROM manifestos m ${join} WHERE ${where}
         ORDER BY lucro DESC LIMIT ${limitNum}`,
        runParams
      );
      topManifestos = Array.isArray(topRows) ? topRows : [];
    } catch {
      try {
        const topRows = await query<TopRowWithTipo[]>(
          `SELECT m.id, m.numero_manifesto, m.data_manifesto, m.tipo_servico, mot.nome AS motorista_nome,
                  NULL AS rota, NULL AS responsavel,
                  m.valor_frete, m.valor_despesa, m.valor_liquido, m.custo_adicional, m.custo_pedagio,
                  (COALESCE(m.valor_liquido, 0) - COALESCE(m.valor_despesa, 0) - COALESCE(m.custo_adicional, 0) - COALESCE(m.custo_pedagio, 0)) AS lucro
           FROM manifestos m ${join} WHERE ${where}
           ORDER BY lucro DESC LIMIT ${limitNum}`,
          runParams
        );
        topManifestos = Array.isArray(topRows) ? topRows : [];
      } catch {
        topManifestos = [];
      }
    }

    // Estatísticas por motorista (com fallback se mot.placa não existir)
    type EstatRow = { motorista_id: number | null; motorista_nome: string | null; placa: string | null; total_manifestos: number; total_frete: number; total_despesa: number; total_liquido: number; percentual_rentabilidade: number; tipos_servico: string | null };
    let estatisticasMotoristas: EstatRow[] = [];
    try {
      const estatRows = await query<EstatRow[]>(
        `SELECT m.motorista_id, mot.nome AS motorista_nome, mot.placa,
                COUNT(*) AS total_manifestos,
                COALESCE(SUM(m.valor_frete), 0) AS total_frete,
                COALESCE(SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)), 0) AS total_despesa,
                COALESCE(SUM(m.valor_frete), 0) - COALESCE(SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)), 0) AS total_liquido,
                CASE WHEN SUM(m.valor_frete) > 0 THEN
                  ROUND(((SUM(m.valor_frete) - SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0))) / SUM(m.valor_frete)) * 100, 2)
                ELSE 0 END AS percentual_rentabilidade,
                GROUP_CONCAT(DISTINCT m.tipo_servico ORDER BY m.tipo_servico SEPARATOR ', ') AS tipos_servico
         FROM manifestos m ${join} WHERE ${where}
         GROUP BY m.motorista_id, mot.nome, mot.placa
         ORDER BY total_liquido DESC`,
        runParams
      );
      estatisticasMotoristas = Array.isArray(estatRows) ? estatRows : [];
    } catch {
      try {
        const joinNoPlaca = 'LEFT JOIN motoristas mot ON mot.id = m.motorista_id';
        const whereNoPlaca = conditions.filter((c) => !c.includes('mot.placa')).join(' AND ');
        const paramsNoPlaca = placa ? runParams.slice(0, -1) : runParams;
        const estatRows = await query<EstatRow[]>(
          `SELECT m.motorista_id, mot.nome AS motorista_nome, NULL AS placa,
                  COUNT(*) AS total_manifestos,
                  COALESCE(SUM(m.valor_frete), 0) AS total_frete,
                  COALESCE(SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)), 0) AS total_despesa,
                  COALESCE(SUM(m.valor_frete), 0) - COALESCE(SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0)), 0) AS total_liquido,
                  CASE WHEN SUM(m.valor_frete) > 0 THEN
                    ROUND(((SUM(m.valor_frete) - SUM(COALESCE(m.valor_despesa, 0) + COALESCE(m.custo_adicional, 0) + COALESCE(m.custo_pedagio, 0))) / SUM(m.valor_frete)) * 100, 2)
                  ELSE 0 END AS percentual_rentabilidade,
                  GROUP_CONCAT(DISTINCT m.tipo_servico ORDER BY m.tipo_servico SEPARATOR ', ') AS tipos_servico
           FROM manifestos m ${joinNoPlaca} WHERE ${whereNoPlaca}
           GROUP BY m.motorista_id, mot.nome
           ORDER BY total_liquido DESC`,
          paramsNoPlaca
        );
        estatisticasMotoristas = Array.isArray(estatRows) ? estatRows : [];
      } catch (e2) {
        console.error('API manifestos/analise estatisticas fallback:', e2);
      }
    }

    // Opções para filtros
    const tiposRows = await query<{ tipo_servico: string }[]>(
      `SELECT DISTINCT tipo_servico FROM manifestos WHERE tipo_servico IS NOT NULL AND tipo_servico != '' ORDER BY tipo_servico`
    );
    const tiposServico = Array.isArray(tiposRows) ? tiposRows.map((r) => r.tipo_servico).filter(Boolean) : [];
    let placas: string[] = [];
    try {
      const placasRows = await query<{ placa: string }[]>(
        `SELECT DISTINCT mot.placa FROM motoristas mot INNER JOIN manifestos m ON m.motorista_id = mot.id WHERE mot.placa IS NOT NULL AND mot.placa != '' ORDER BY mot.placa`
      );
      placas = Array.isArray(placasRows) ? placasRows.map((r) => r.placa).filter(Boolean) : [];
    } catch {
      placas = [];
    }
    const motoristasRows = await query<{ id: number; nome: string }[]>(
      'SELECT id, nome FROM motoristas WHERE ativo = 1 ORDER BY nome LIMIT 500'
    );
    const motoristas = Array.isArray(motoristasRows) ? motoristasRows : [];

    return NextResponse.json({
      success: true,
      data: {
        analiseGeral,
        topManifestos,
        estatisticasMotoristas,
        tiposServico,
        placas,
        motoristas,
      },
    });
  } catch (e) {
    console.error('API manifestos/analise GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar análise.', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
