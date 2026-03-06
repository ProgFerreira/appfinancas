import { query } from '@/lib/db';

export interface PriceTableFeesRow {
  id: number;
  price_table_id: number;
  gris_percent: number | null;
  advalorem_percent: number | null;
  tde_fixo: number | null;
  tde_percent: number | null;
  trt_fixo: number | null;
  tda_fixo: number | null;
  pedagio_fixo: number | null;
  seguro_minimo: number | null;
  seguro_percent: number | null;
  coleta_fixo: number | null;
  entrega_fixo: number | null;
  fator_cubagem_rodoviario: number;
  fator_cubagem_aereo: number;
  peso_minimo_tarifavel_kg: number | null;
  arredondar_peso_cima: number;
  prazo_rodoviario_dias: number | null;
  prazo_aereo_dias: number | null;
}

const TABLE = 'cotacao_price_table_fees';

export async function findByPriceTableId(priceTableId: number): Promise<PriceTableFeesRow | null> {
  const rows = await query<PriceTableFeesRow[]>(
    `SELECT id, price_table_id, gris_percent, advalorem_percent, tde_fixo, tde_percent, trt_fixo, tda_fixo,
     pedagio_fixo, seguro_minimo, seguro_percent, coleta_fixo, entrega_fixo,
     fator_cubagem_rodoviario, fator_cubagem_aereo, peso_minimo_tarifavel_kg, arredondar_peso_cima,
     prazo_rodoviario_dias, prazo_aereo_dias, created_at, updated_at FROM ${TABLE} WHERE price_table_id = ? LIMIT 1`,
    [priceTableId]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function upsert(data: Partial<PriceTableFeesRow> & { price_table_id: number }): Promise<void> {
  const existing = await findByPriceTableId(data.price_table_id);
  const ptId = data.price_table_id;
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
  const prazoRod = data.prazo_rodoviario_dias ?? existing?.prazo_rodoviario_dias ?? null;
  const prazoAereo = data.prazo_aereo_dias ?? existing?.prazo_aereo_dias ?? null;

  if (existing) {
    await query(
      `UPDATE ${TABLE} SET gris_percent=?, advalorem_percent=?, tde_fixo=?, tde_percent=?, trt_fixo=?, tda_fixo=?,
       pedagio_fixo=?, seguro_minimo=?, seguro_percent=?, coleta_fixo=?, entrega_fixo=?,
       fator_cubagem_rodoviario=?, fator_cubagem_aereo=?, peso_minimo_tarifavel_kg=?, arredondar_peso_cima=?,
       prazo_rodoviario_dias=?, prazo_aereo_dias=? WHERE price_table_id=?`,
      [gris, advalorem, tdeFixo, tdePercent, trtFixo, tdaFixo, pedagio, seguroMin, seguroPct, coleta, entrega, fatorRod, fatorAereo, pesoMin, arredondar, prazoRod, prazoAereo, ptId]
    );
  } else {
    await query(
      `INSERT INTO ${TABLE} (price_table_id, gris_percent, advalorem_percent, tde_fixo, tde_percent, trt_fixo, tda_fixo, pedagio_fixo, seguro_minimo, seguro_percent, coleta_fixo, entrega_fixo, fator_cubagem_rodoviario, fator_cubagem_aereo, peso_minimo_tarifavel_kg, arredondar_peso_cima, prazo_rodoviario_dias, prazo_aereo_dias)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ptId, gris, advalorem, tdeFixo, tdePercent, trtFixo, tdaFixo, pedagio, seguroMin, seguroPct, coleta, entrega, fatorRod, fatorAereo, pesoMin, arredondar, prazoRod, prazoAereo]
    );
  }
}
