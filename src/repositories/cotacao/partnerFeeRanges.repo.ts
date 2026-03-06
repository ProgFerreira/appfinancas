import { query } from '@/lib/db';

export interface PesoFracaoRow {
  id: number;
  partner_id: number;
  fracao_kg: number;
  minimo_fixo: number;
  peso_franquia_kg: number;
  excedente_por_fracao: number;
}

export interface FaixaPesoRow {
  id: number;
  partner_id: number;
  peso_inicial_kg: number;
  peso_final_kg: number;
  tarifa_minima: number;
  peso_franquia_kg?: number;
  peso_excedente?: number;
}

export interface FaixaFreteRow {
  id: number;
  partner_id: number;
  frete_inicial: number;
  frete_final: number;
  tarifa_minima: number;
  frete_franquia: number;
  frete_excedente: number;
}

/** Faixa por valor NF: Quantidade NF inicial/final, R$ Mínimo/Fixo, Franquia/desconto, NF excedente */
export interface FaixaNFRow {
  id?: number;
  partner_id?: number;
  valor_inicial: number;
  valor_final: number;
  minimo_fixo: number;
  franquia_desconto: number;
  nf_excedente: number;
}

/** Faixa por peso com NF excedente: Peso ini/fim, R$ Mínimo/Fixo, Peso franquia, NF excedente */
export interface FaixaPesoNFRow {
  id?: number;
  partner_id?: number;
  peso_inicial_kg: number;
  peso_final_kg: number;
  minimo_fixo: number;
  peso_franquia_kg: number;
  nf_excedente: number;
}

export interface PartnerFeeRanges {
  peso_fracao: PesoFracaoRow | null;
  peso_faixas: FaixaPesoRow[];
  pedagio_faixas: FaixaPesoRow[];
  pedagio_fracao: PesoFracaoRow | null;
  trt_faixas: FaixaFreteRow[];
  tas_faixas: FaixaPesoRow[];
  tde_faixas: FaixaFreteRow[];
  tde_peso_faixas: FaixaPesoRow[];
  advalorem_nf_faixas: FaixaNFRow[];
  advalorem_peso_faixas: FaixaPesoNFRow[];
  advalorem_carga_faixas: FaixaNFRow[];
  gris_nf_faixas: FaixaNFRow[];
  gris_peso_faixas: FaixaPesoNFRow[];
  despacho_faixas: FaixaPesoRow[];
  despacho_nf_faixas: FaixaDespachoNFRow[];
}

export interface FaixaDespachoNFRow {
  valor_inicial: number;
  valor_final: number;
  tarifa_minima: number;
  franquia_desconto: number;
  nf_excedente: number;
}

export async function getFeeRangesByPartnerId(partnerId: number): Promise<PartnerFeeRanges> {
  const base = await Promise.all([
    query<PesoFracaoRow[]>('SELECT id, partner_id, fracao_kg, minimo_fixo, peso_franquia_kg, excedente_por_fracao FROM cotacao_fee_peso_fracao WHERE partner_id = ? LIMIT 1', [partnerId]),
    query<FaixaPesoRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente FROM cotacao_fee_peso_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]).catch(() => []),
    query<FaixaPesoRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente FROM cotacao_fee_pedagio_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]),
    query<PesoFracaoRow[]>('SELECT id, partner_id, fracao_kg, minimo_fixo, peso_franquia_kg, excedente_por_fracao FROM cotacao_fee_pedagio_fracao WHERE partner_id = ? LIMIT 1', [partnerId]),
    query<FaixaFreteRow[]>('SELECT id, partner_id, frete_inicial, frete_final, tarifa_minima, frete_franquia, frete_excedente FROM cotacao_fee_trt_faixas WHERE partner_id = ? ORDER BY frete_inicial', [partnerId]),
    query<FaixaPesoRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente FROM cotacao_fee_tas_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]),
    query<FaixaFreteRow[]>('SELECT id, partner_id, frete_inicial, frete_final, tarifa_minima, frete_franquia, frete_excedente FROM cotacao_fee_tde_faixas WHERE partner_id = ? ORDER BY frete_inicial', [partnerId]),
    query<FaixaPesoRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente FROM cotacao_fee_tde_peso_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]),
  ]);
  const extra = await Promise.all([
    query<FaixaNFRow[]>('SELECT id, partner_id, valor_inicial, valor_final, minimo_fixo, franquia_desconto, nf_excedente FROM cotacao_fee_advalorem_nf_faixas WHERE partner_id = ? ORDER BY valor_inicial', [partnerId]).catch(() => []),
    query<FaixaPesoNFRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, minimo_fixo, peso_franquia_kg, nf_excedente FROM cotacao_fee_advalorem_peso_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]).catch(() => []),
    query<FaixaNFRow[]>('SELECT id, partner_id, valor_inicial, valor_final, minimo_fixo, franquia_desconto, nf_excedente FROM cotacao_fee_advalorem_carga_faixas WHERE partner_id = ? ORDER BY valor_inicial', [partnerId]).catch(() => []),
    query<FaixaNFRow[]>('SELECT id, partner_id, valor_inicial, valor_final, minimo_fixo, franquia_desconto, nf_excedente FROM cotacao_fee_gris_nf_faixas WHERE partner_id = ? ORDER BY valor_inicial', [partnerId]).catch(() => []),
    query<FaixaPesoNFRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, minimo_fixo, peso_franquia_kg, nf_excedente FROM cotacao_fee_gris_peso_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]).catch(() => []),
    query<FaixaPesoRow[]>('SELECT id, partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente FROM cotacao_fee_despacho_faixas WHERE partner_id = ? ORDER BY peso_inicial_kg', [partnerId]).catch(() => []),
    query<FaixaDespachoNFRow[]>('SELECT id, partner_id, valor_inicial, valor_final, tarifa_minima, franquia_desconto, nf_excedente FROM cotacao_fee_despacho_nf_faixas WHERE partner_id = ? ORDER BY valor_inicial', [partnerId]).catch(() => []),
  ]);
  const [pesoFracao, pesoFaixas, pedagioFaixas, pedagioFracao, trtFaixas, tasFaixas, tdeFaixas, tdePesoFaixas] = base;
  const [advaloremNf, advaloremPeso, advaloremCarga, grisNf, grisPeso, despachoFaixas, despachoNf] = extra;

  const one = (arr: unknown[]): unknown => (Array.isArray(arr) && arr.length > 0 ? arr[0] : null);
  const list = (arr: unknown[]): unknown[] => (Array.isArray(arr) ? arr : []);

  return {
    peso_fracao: one(pesoFracao) as PesoFracaoRow | null,
    peso_faixas: list(pesoFaixas) as FaixaPesoRow[],
    pedagio_faixas: list(pedagioFaixas) as FaixaPesoRow[],
    pedagio_fracao: one(pedagioFracao) as PesoFracaoRow | null,
    trt_faixas: list(trtFaixas) as FaixaFreteRow[],
    tas_faixas: list(tasFaixas) as FaixaPesoRow[],
    tde_faixas: list(tdeFaixas) as FaixaFreteRow[],
    tde_peso_faixas: list(tdePesoFaixas) as FaixaPesoRow[],
    advalorem_nf_faixas: list(advaloremNf) as FaixaNFRow[],
    advalorem_peso_faixas: list(advaloremPeso) as FaixaPesoNFRow[],
    advalorem_carga_faixas: list(advaloremCarga) as FaixaNFRow[],
    gris_nf_faixas: list(grisNf) as FaixaNFRow[],
    gris_peso_faixas: list(grisPeso) as FaixaPesoNFRow[],
    despacho_faixas: list(despachoFaixas) as FaixaPesoRow[],
    despacho_nf_faixas: list(despachoNf) as FaixaDespachoNFRow[],
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export async function saveFeeRanges(partnerId: number, data: Partial<PartnerFeeRanges>): Promise<void> {
  if (data.peso_fracao != null) {
    const p = data.peso_fracao as unknown as Record<string, unknown>;
    const fracao = num(p.fracao_kg);
    const min = num(p.minimo_fixo);
    const franq = num(p.peso_franquia_kg);
    const exced = num(p.excedente_por_fracao);
    const existing = await query<{ id: number }[]>('SELECT id FROM cotacao_fee_peso_fracao WHERE partner_id = ? LIMIT 1', [partnerId]);
    const arr = Array.isArray(existing) ? existing : [];
    if (arr.length > 0) {
      await query('UPDATE cotacao_fee_peso_fracao SET fracao_kg=?, minimo_fixo=?, peso_franquia_kg=?, excedente_por_fracao=? WHERE partner_id=?', [fracao, min, franq, exced, partnerId]);
    } else {
      await query('INSERT INTO cotacao_fee_peso_fracao (partner_id, fracao_kg, minimo_fixo, peso_franquia_kg, excedente_por_fracao) VALUES (?,?,?,?,?)', [partnerId, fracao, min, franq, exced]);
    }
  }

  if (data.pedagio_fracao != null) {
    const p = data.pedagio_fracao as unknown as Record<string, unknown>;
    const fracao = num(p.fracao_kg);
    const min = num(p.minimo_fixo);
    const franq = num(p.peso_franquia_kg);
    const exced = num(p.excedente_por_fracao);
    const existing = await query<{ id: number }[]>('SELECT id FROM cotacao_fee_pedagio_fracao WHERE partner_id = ? LIMIT 1', [partnerId]);
    const arr = Array.isArray(existing) ? existing : [];
    if (arr.length > 0) {
      await query('UPDATE cotacao_fee_pedagio_fracao SET fracao_kg=?, minimo_fixo=?, peso_franquia_kg=?, excedente_por_fracao=? WHERE partner_id=?', [fracao, min, franq, exced, partnerId]);
    } else {
      await query('INSERT INTO cotacao_fee_pedagio_fracao (partner_id, fracao_kg, minimo_fixo, peso_franquia_kg, excedente_por_fracao) VALUES (?,?,?,?,?)', [partnerId, fracao, min, franq, exced]);
    }
  }

  const saveFaixaPeso = async (table: string, rows: FaixaPesoRow[]) => {
    await query(`DELETE FROM ${table} WHERE partner_id = ?`, [partnerId]);
    for (const r of rows) {
      const pi = num(r.peso_inicial_kg);
      const pf = num(r.peso_final_kg);
      const tm = num(r.tarifa_minima);
      const pfr = num((r as unknown as Record<string, unknown>).peso_franquia_kg);
      const pe = num((r as unknown as Record<string, unknown>).peso_excedente);
      await query(`INSERT INTO ${table} (partner_id, peso_inicial_kg, peso_final_kg, tarifa_minima, peso_franquia_kg, peso_excedente) VALUES (?,?,?,?,?,?)`, [partnerId, pi, pf, tm, pfr, pe]);
    }
  };

  const saveFaixaFrete = async (table: string, rows: FaixaFreteRow[]) => {
    await query(`DELETE FROM ${table} WHERE partner_id = ?`, [partnerId]);
    for (const r of rows) {
      const fi = num(r.frete_inicial);
      const ff = num(r.frete_final);
      const tm = num(r.tarifa_minima);
      const fr = num(r.frete_franquia);
      const ex = num(r.frete_excedente);
      await query(`INSERT INTO ${table} (partner_id, frete_inicial, frete_final, tarifa_minima, frete_franquia, frete_excedente) VALUES (?,?,?,?,?,?)`, [partnerId, fi, ff, tm, fr, ex]);
    }
  };

  const saveFaixaNF = async (table: string, rows: FaixaNFRow[]) => {
    await query(`DELETE FROM ${table} WHERE partner_id = ?`, [partnerId]);
    for (const r of rows) {
      await query(`INSERT INTO ${table} (partner_id, valor_inicial, valor_final, minimo_fixo, franquia_desconto, nf_excedente) VALUES (?,?,?,?,?,?)`,
        [partnerId, num(r.valor_inicial), num(r.valor_final), num(r.minimo_fixo), num(r.franquia_desconto), num(r.nf_excedente)]);
    }
  };
  const saveFaixaPesoNF = async (table: string, rows: FaixaPesoNFRow[]) => {
    await query(`DELETE FROM ${table} WHERE partner_id = ?`, [partnerId]);
    for (const r of rows) {
      await query(`INSERT INTO ${table} (partner_id, peso_inicial_kg, peso_final_kg, minimo_fixo, peso_franquia_kg, nf_excedente) VALUES (?,?,?,?,?,?)`,
        [partnerId, num(r.peso_inicial_kg), num(r.peso_final_kg), num(r.minimo_fixo), num(r.peso_franquia_kg), num(r.nf_excedente)]);
    }
  };
  const saveFaixaDespachoNF = async (rows: FaixaDespachoNFRow[]) => {
    await query('DELETE FROM cotacao_fee_despacho_nf_faixas WHERE partner_id = ?', [partnerId]);
    for (const r of rows) {
      await query('INSERT INTO cotacao_fee_despacho_nf_faixas (partner_id, valor_inicial, valor_final, tarifa_minima, franquia_desconto, nf_excedente) VALUES (?,?,?,?,?,?)',
        [partnerId, num(r.valor_inicial), num(r.valor_final), num(r.tarifa_minima), num(r.franquia_desconto), num(r.nf_excedente)]);
    }
  };

  if (data.peso_faixas != null) await saveFaixaPeso('cotacao_fee_peso_faixas', data.peso_faixas as FaixaPesoRow[]);
  if (data.pedagio_faixas != null) await saveFaixaPeso('cotacao_fee_pedagio_faixas', data.pedagio_faixas as FaixaPesoRow[]);
  if (data.trt_faixas != null) await saveFaixaFrete('cotacao_fee_trt_faixas', data.trt_faixas as FaixaFreteRow[]);
  if (data.tas_faixas != null) await saveFaixaPeso('cotacao_fee_tas_faixas', data.tas_faixas as FaixaPesoRow[]);
  if (data.tde_faixas != null) await saveFaixaFrete('cotacao_fee_tde_faixas', data.tde_faixas as FaixaFreteRow[]);
  if (data.tde_peso_faixas != null) await saveFaixaPeso('cotacao_fee_tde_peso_faixas', data.tde_peso_faixas as FaixaPesoRow[]);
  if (data.advalorem_nf_faixas != null) await saveFaixaNF('cotacao_fee_advalorem_nf_faixas', data.advalorem_nf_faixas);
  if (data.advalorem_peso_faixas != null) await saveFaixaPesoNF('cotacao_fee_advalorem_peso_faixas', data.advalorem_peso_faixas);
  if (data.advalorem_carga_faixas != null) await saveFaixaNF('cotacao_fee_advalorem_carga_faixas', data.advalorem_carga_faixas);
  if (data.gris_nf_faixas != null) await saveFaixaNF('cotacao_fee_gris_nf_faixas', data.gris_nf_faixas);
  if (data.gris_peso_faixas != null) await saveFaixaPesoNF('cotacao_fee_gris_peso_faixas', data.gris_peso_faixas);
  if (data.despacho_faixas != null) await saveFaixaPeso('cotacao_fee_despacho_faixas', data.despacho_faixas as FaixaPesoRow[]);
  if (data.despacho_nf_faixas != null) await saveFaixaDespachoNF(data.despacho_nf_faixas);
}
