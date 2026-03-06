import * as cepPracasRepo from '@/repositories/cotacao/cepPracas.repo';
import * as coverageRepo from '@/repositories/cotacao/coverage.repo';
import * as partnerRepo from '@/repositories/cotacao/partner.repo';
import * as partnerFeesRepo from '@/repositories/cotacao/partnerFees.repo';
import * as priceTableRepo from '@/repositories/cotacao/priceTable.repo';
import type { CotacaoParceiroTipo, QuoteBreakdown, QuoteOption } from '@/types';

export interface QuoteInput {
  /** Quando informados, origem/destino são por cidade (não usa CEP). */
  origem_uf?: string;
  origem_cidade?: string;
  destino_uf?: string;
  destino_cidade?: string;
  origem_cep?: string;
  destino_cep?: string;
  tipo_carga?: string;
  valor_nf: number;
  peso_real_kg: number;
  peso_cubado_kg: number;
  peso_tarifavel_kg: number;
  servico_ar?: boolean;
  servico_mao_propria?: boolean;
  servico_coleta?: boolean;
  servico_entrega?: boolean;
  servico_seguro?: boolean;
}

/**
 * Regra de excedente: peso tarifável pode ultrapassar o peso_final_kg da faixa.
 * Excedente = max(0, peso_tarifavel_kg - peso_final_kg da faixa).
 * Valor excedente = excedente_kg * valor_excedente_por_kg (se definido).
 */
export async function calculateOptions(input: QuoteInput): Promise<QuoteOption[]> {
  let origemUf: string;
  let origemCidade: string;
  let destinoUf: string;
  let destinoCidade: string;
  let destinoCep: string | undefined;

  if (input.origem_uf != null && input.origem_cidade != null && input.destino_uf != null && input.destino_cidade != null) {
    origemUf = input.origem_uf.trim();
    origemCidade = input.origem_cidade.trim();
    destinoUf = input.destino_uf.trim();
    destinoCidade = input.destino_cidade.trim();
    destinoCep = undefined;
  } else if (input.origem_cep != null && input.destino_cep != null) {
    const origemCep = input.origem_cep.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
    destinoCep = input.destino_cep.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
    const [origemPraça, destinoPraça] = await Promise.all([
      cepPracasRepo.findByCep(origemCep),
      cepPracasRepo.findByCep(destinoCep),
    ]);
    if (!destinoPraça) return [];
    origemUf = origemPraça?.uf ?? '';
    origemCidade = origemPraça?.cidade ?? '';
    destinoUf = destinoPraça.uf;
    destinoCidade = destinoPraça.cidade;
  } else {
    return [];
  }

  const partnerIds = await coverageRepo.findPartnerIdsByDestino(destinoUf, destinoCidade, destinoCep);
  if (partnerIds.length === 0) return [];

  const priceTables = await priceTableRepo.findByRoute(origemUf, origemCidade, destinoUf, destinoCidade);
  const options: QuoteOption[] = [];

  for (const pt of priceTables) {
    if (!partnerIds.includes(pt.partner_id)) continue;

    const partner = await partnerRepo.findById(pt.partner_id);
    if (!partner || !partner.ativo) continue;

    const fees = await partnerFeesRepo.findByPartnerId(pt.partner_id);
    const range = await priceTableRepo.findApplicableRange(pt.id, input.peso_tarifavel_kg);
    if (!range) continue;

    let pesoParaExcedente = input.peso_tarifavel_kg;
    const pesoMin = fees?.peso_minimo_tarifavel_kg;
    if (pesoMin != null && input.peso_tarifavel_kg < pesoMin) {
      pesoParaExcedente = pesoMin;
    }

    const fatorCubagem = partner.tipo === 'AEREO' ? (fees?.fator_cubagem_aereo ?? 166.7) : (fees?.fator_cubagem_rodoviario ?? 300);
    const valorBase = Number(range.valor_base);
    let excedenteKg = Math.max(0, pesoParaExcedente - range.peso_final_kg);
    const valorExcedentePorKg = range.valor_excedente_por_kg ?? 0;
    const valorExcedente = excedenteKg * valorExcedentePorKg;

    const grisPct = fees?.gris_percent ?? 0;
    const advaloremPct = fees?.advalorem_percent ?? 0;
    const gris = input.valor_nf * grisPct;
    const advalorem = input.valor_nf * advaloremPct;

    let seguro = 0;
    if (input.servico_seguro && fees) {
      const min = fees.seguro_minimo ?? 0;
      const pct = fees.seguro_percent ?? 0;
      seguro = Math.max(min, input.valor_nf * pct);
    }

    const pedagio = fees?.pedagio_fixo ?? 0;
    const tde = (fees?.tde_fixo ?? 0) + (fees?.tde_percent != null ? input.valor_nf * fees.tde_percent : 0);
    const trt = fees?.trt_fixo ?? 0;
    const tda = fees?.tda_fixo ?? 0;

    let coleta = 0;
    let entrega = 0;
    if (input.servico_coleta) coleta = fees?.coleta_fixo ?? 0;
    if (input.servico_entrega) entrega = fees?.entrega_fixo ?? 0;

    const fretePeso = valorBase + valorExcedente;
    const tas = 0;
    const txDespacho = 0;
    const txRedespacho = 0;
    const setCat = 0;
    const pctNf = 0;

    const precoFinal =
      fretePeso +
      gris +
      advalorem +
      seguro +
      pedagio +
      tde +
      trt +
      tda +
      coleta +
      entrega +
      tas +
      txDespacho +
      txRedespacho +
      setCat;

    const composicao = Math.round(precoFinal * 100) / 100;
    const mediaKg = input.peso_tarifavel_kg;

    const breakdown: QuoteBreakdown = {
      tx_coleta: Math.round(coleta * 100) / 100,
      tx_pedagio: Math.round(pedagio * 100) / 100,
      tx_gris: Math.round(gris * 100) / 100,
      tas: Math.round(tas * 100) / 100,
      tx_entrega: Math.round(entrega * 100) / 100,
      tx_tad: Math.round(tda * 100) / 100,
      tx_peso_add: Math.round(valorExcedente * 100) / 100,
      trt: Math.round(trt * 100) / 100,
      pct_nf: pctNf,
      advalorem: Math.round(advalorem * 100) / 100,
      tx_redespacho: Math.round(txRedespacho * 100) / 100,
      tde: Math.round(tde * 100) / 100,
      frete_peso: Math.round(fretePeso * 100) / 100,
      outras_taxas: Math.round(seguro * 100) / 100,
      tx_despacho: Math.round(txDespacho * 100) / 100,
      set_cat: Math.round(setCat * 100) / 100,
      composicao,
      media_kg: Math.round(mediaKg * 100) / 100,
      subtotal: composicao,
      frete_total: composicao,
      cod_trecho: pt.id,
    };

    options.push({
      partner_id: partner.id,
      partner_nome: partner.nome,
      tipo: partner.tipo as CotacaoParceiroTipo,
      prazo_dias: range.prazo_dias,
      preco_final: composicao,
      breakdown: { ...breakdown } as QuoteOption['breakdown'],
    });
  }

  return options;
}
