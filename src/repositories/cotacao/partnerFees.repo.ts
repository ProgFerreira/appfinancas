import { query } from '@/lib/db';
import type { CotacaoPartnerFees } from '@/types';

const TABLE = 'cotacao_partner_fees';

const FEE_COLUMNS = `id, partner_id, gris_percent, advalorem_percent, tde_fixo, tde_percent, trt_fixo, tda_fixo, pedagio_fixo,
  seguro_minimo, seguro_percent, coleta_fixo, entrega_fixo, fator_cubagem_rodoviario, fator_cubagem_aereo,
  peso_minimo_tarifavel_kg, arredondar_peso_cima,
  lib_suframa, minimo_trecho, tde_geral, reentrega_percent, reentrega_taxa_fixa, reentrega_minima, reentrega_soma_icms,
  devolucao_percent, devolucao_taxa_fixa, devolucao_minima, devolucao_soma_icms,
  margem_rodoviario, margem_aereo, margem_base_cte,
  tarifa_aerea_minima, tarifa_aerea_taxa_extra, tarifa_aerea_tad, tarifa_aerea_soma_minimo,
  percentual_frete, percentual_pedagio_frete, desconto_max_percent, acrescimo_max_percent,
  created_at, updated_at`;

export async function findByPartnerId(partnerId: number): Promise<CotacaoPartnerFees | null> {
  const rows = await query<CotacaoPartnerFees[]>(
    `SELECT ${FEE_COLUMNS} FROM ${TABLE} WHERE partner_id = ? LIMIT 1`,
    [partnerId]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

type UpsertData = {
  partner_id: number;
  gris_percent?: number | null;
  advalorem_percent?: number | null;
  tde_fixo?: number | null;
  tde_percent?: number | null;
  trt_fixo?: number | null;
  tda_fixo?: number | null;
  pedagio_fixo?: number | null;
  seguro_minimo?: number | null;
  seguro_percent?: number | null;
  coleta_fixo?: number | null;
  entrega_fixo?: number | null;
  fator_cubagem_rodoviario?: number;
  fator_cubagem_aereo?: number;
  peso_minimo_tarifavel_kg?: number | null;
  arredondar_peso_cima?: number;
  lib_suframa?: number;
  minimo_trecho?: number;
  tde_geral?: number;
  reentrega_percent?: number;
  reentrega_taxa_fixa?: number;
  reentrega_minima?: number;
  reentrega_soma_icms?: number;
  devolucao_percent?: number;
  devolucao_taxa_fixa?: number;
  devolucao_minima?: number;
  devolucao_soma_icms?: number;
  margem_rodoviario?: number;
  margem_aereo?: number;
  margem_base_cte?: string | null;
  tarifa_aerea_minima?: number;
  tarifa_aerea_taxa_extra?: number;
  tarifa_aerea_tad?: number;
  tarifa_aerea_soma_minimo?: number;
  percentual_frete?: number;
  percentual_pedagio_frete?: number;
  desconto_max_percent?: number;
  acrescimo_max_percent?: number;
};

export async function upsert(data: UpsertData): Promise<void> {
  const existing = await findByPartnerId(data.partner_id);
  const gris = data.gris_percent ?? existing?.gris_percent ?? null;
  const advalorem = data.advalorem_percent ?? existing?.advalorem_percent ?? null;
  const tdeFixo = data.tde_fixo ?? existing?.tde_fixo ?? null;
  const tdePercent = data.tde_percent ?? existing?.tde_percent ?? null;
  const trtFixo = data.trt_fixo ?? existing?.trt_fixo ?? null;
  const tdaFixo = data.tda_fixo ?? existing?.tda_fixo ?? null;
  const pedagio = data.pedagio_fixo ?? existing?.pedagio_fixo ?? null;
  const seguroMin = data.seguro_minimo ?? existing?.seguro_minimo ?? null;
  const seguroPct = data.seguro_percent ?? existing?.seguro_percent ?? null;
  const coleta = data.coleta_fixo ?? existing?.coleta_fixo ?? null;
  const entrega = data.entrega_fixo ?? existing?.entrega_fixo ?? null;
  const fatorRod = data.fator_cubagem_rodoviario ?? existing?.fator_cubagem_rodoviario ?? 300;
  const fatorAereo = data.fator_cubagem_aereo ?? existing?.fator_cubagem_aereo ?? 166.7;
  const pesoMin = data.peso_minimo_tarifavel_kg ?? existing?.peso_minimo_tarifavel_kg ?? null;
  const arredondar = data.arredondar_peso_cima ?? existing?.arredondar_peso_cima ?? 1;
  const ex = existing as unknown as Record<string, unknown> | null;
  const libSuframa: number = Number(data.lib_suframa ?? ex?.lib_suframa ?? 0);
  const minTrecho: number = Number(data.minimo_trecho ?? ex?.minimo_trecho ?? 0);
  const tdeGeral: number = Number(data.tde_geral ?? ex?.tde_geral ?? 0);
  const reentPct: number = Number(data.reentrega_percent ?? ex?.reentrega_percent ?? 0);
  const reentFixo: number = Number(data.reentrega_taxa_fixa ?? ex?.reentrega_taxa_fixa ?? 0);
  const reentMin: number = Number(data.reentrega_minima ?? ex?.reentrega_minima ?? 0);
  const reentIcms: number = Number(data.reentrega_soma_icms ?? ex?.reentrega_soma_icms ?? 0);
  const devPct: number = Number(data.devolucao_percent ?? ex?.devolucao_percent ?? 0);
  const devFixo: number = Number(data.devolucao_taxa_fixa ?? ex?.devolucao_taxa_fixa ?? 0);
  const devMin: number = Number(data.devolucao_minima ?? ex?.devolucao_minima ?? 0);
  const devIcms: number = Number(data.devolucao_soma_icms ?? ex?.devolucao_soma_icms ?? 0);
  const margemRod: number = Number(data.margem_rodoviario ?? ex?.margem_rodoviario ?? 0);
  const margemAer: number = Number(data.margem_aereo ?? ex?.margem_aereo ?? 0);
  const margemBase: string = String(data.margem_base_cte ?? ex?.margem_base_cte ?? 'frete_total');
  const tarAereaMin: number = Number(data.tarifa_aerea_minima ?? ex?.tarifa_aerea_minima ?? 0);
  const tarAereaExtra: number = Number(data.tarifa_aerea_taxa_extra ?? ex?.tarifa_aerea_taxa_extra ?? 0);
  const tarAereaTad: number = Number(data.tarifa_aerea_tad ?? ex?.tarifa_aerea_tad ?? 0);
  const tarAereaSoma: number = Number(data.tarifa_aerea_soma_minimo ?? ex?.tarifa_aerea_soma_minimo ?? 1);
  const pctFrete: number = Number(data.percentual_frete ?? ex?.percentual_frete ?? 0);
  const pctPedagio: number = Number(data.percentual_pedagio_frete ?? ex?.percentual_pedagio_frete ?? 0);
  const descMax: number = Number(data.desconto_max_percent ?? ex?.desconto_max_percent ?? 0);
  const acrMax: number = Number(data.acrescimo_max_percent ?? ex?.acrescimo_max_percent ?? 0);

  const params: (string | number | null)[] = [
      gris, advalorem, tdeFixo, tdePercent, trtFixo, tdaFixo, pedagio, seguroMin, seguroPct, coleta, entrega, fatorRod, fatorAereo, pesoMin, arredondar,
      libSuframa, minTrecho, tdeGeral, reentPct, reentFixo, reentMin, reentIcms,
      devPct, devFixo, devMin, devIcms, margemRod, margemAer, margemBase,
      tarAereaMin, tarAereaExtra, tarAereaTad, tarAereaSoma, pctFrete, pctPedagio, descMax, acrMax,
    ];
  if (existing) {
    await query(
      `UPDATE ${TABLE} SET gris_percent=?, advalorem_percent=?, tde_fixo=?, tde_percent=?, trt_fixo=?, tda_fixo=?,
       pedagio_fixo=?, seguro_minimo=?, seguro_percent=?, coleta_fixo=?, entrega_fixo=?,
       fator_cubagem_rodoviario=?, fator_cubagem_aereo=?, peso_minimo_tarifavel_kg=?, arredondar_peso_cima=?,
       lib_suframa=?, minimo_trecho=?, tde_geral=?, reentrega_percent=?, reentrega_taxa_fixa=?, reentrega_minima=?, reentrega_soma_icms=?,
       devolucao_percent=?, devolucao_taxa_fixa=?, devolucao_minima=?, devolucao_soma_icms=?,
       margem_rodoviario=?, margem_aereo=?, margem_base_cte=?,
       tarifa_aerea_minima=?, tarifa_aerea_taxa_extra=?, tarifa_aerea_tad=?, tarifa_aerea_soma_minimo=?,
       percentual_frete=?, percentual_pedagio_frete=?, desconto_max_percent=?, acrescimo_max_percent=? WHERE partner_id=?`,
      [...params, data.partner_id]
    );
  } else {
    await query(
      `INSERT INTO ${TABLE} (partner_id, gris_percent, advalorem_percent, tde_fixo, tde_percent, trt_fixo, tda_fixo, pedagio_fixo, seguro_minimo, seguro_percent, coleta_fixo, entrega_fixo, fator_cubagem_rodoviario, fator_cubagem_aereo, peso_minimo_tarifavel_kg, arredondar_peso_cima,
        lib_suframa, minimo_trecho, tde_geral, reentrega_percent, reentrega_taxa_fixa, reentrega_minima, reentrega_soma_icms, devolucao_percent, devolucao_taxa_fixa, devolucao_minima, devolucao_soma_icms, margem_rodoviario, margem_aereo, margem_base_cte,
        tarifa_aerea_minima, tarifa_aerea_taxa_extra, tarifa_aerea_tad, tarifa_aerea_soma_minimo, percentual_frete, percentual_pedagio_frete, desconto_max_percent, acrescimo_max_percent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.partner_id, ...params]
    );
  }
}
