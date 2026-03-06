export type PerfilUsuario = 'administrador' | 'financeiro' | 'diretoria' | 'operacao';
export type StatusUsuario = 'ativo' | 'inativo';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  ativo: number;
  created_at: string;
  updated_at: string;
}

export interface UsuarioComSenha extends Usuario {
  senha_hash: string;
}

export interface Cliente {
  id: number;
  nome: string;
  razao_social: string | null;
  cnpj_cpf: string | null;
  inscricao_estadual: string | null;
  tipo_cadastro: string;
  tipo_parceiro: string | null;
  condicao_pagamento: string | null;
  dados_bancarios: string | null;
  classificacao: 'A' | 'B' | 'C' | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  telefone_xml: string | null;
  observacoes?: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  codigo_municipio: number | null;
  municipio: string | null;
  uf: string | null;
  codigo_pais: number | null;
  pais: string | null;
  prazo_pagamento: number | null;
  tipo_cobranca: string | null;
  pode_faturar: number;
  centro_custo_id: number | null;
  categoria_receita_id: number | null;
  categoria_despesa_id: number | null;
  plano_contas_id: number | null;
  plano_contas_despesa_id: number | null;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContaPagar {
  id: number;
  fornecedor_id: number | null;
  descricao: string | null;
  categoria_id: number;
  plano_contas_id: number | null;
  centro_custo_id: number | null;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_competencia?: string | null;
  conta_bancaria_id: number | null;
  forma_pagamento: string | null;
  situacao: string;
  tipo_custo: string;
  origem: string | null;
  cte_id: number | null;
  observacoes: string | null;
  ativo: number;
  created_at: string;
  updated_at: string;
  fornecedor_nome?: string;
  plano_contas_nome?: string;
  categoria_nome?: string;
  centro_custo_nome?: string;
  conta_bancaria_descricao?: string;
}

export interface ContaReceber {
  id: number;
  cliente_id: number;
  categoria_receita_id: number | null;
  plano_contas_id: number | null;
  descricao: string | null;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_competencia?: string | null;
  conta_bancaria_id: number | null;
  situacao: string;
  cte_id: number | null;
  observacoes: string | null;
  ativo: number;
  created_at: string;
  updated_at: string;
  cliente_nome?: string;
  categoria_receita_nome?: string;
  plano_contas_nome?: string;
  conta_bancaria_descricao?: string;
}

export interface ContaBancaria {
  id: number;
  descricao: string;
  banco: string;
  ativo: number;
}

export interface CentroCusto {
  id: number;
  codigo: string | null;
  nome: string;
  ativo: number;
}

export interface CategoriaDespesa {
  id: number;
  nome: string;
  ativo: number;
}

export interface CategoriaReceita {
  id: number;
  nome: string;
  ativo: number;
}

export interface DespesaFixa {
  id: number;
  categoria_id: number;
  plano_contas_id: number | null;
  centro_custo_id: number | null;
  fornecedor_id: number | null;
  descricao: string;
  valor_previsto: number;
  dia_vencimento: number;
  gerar_automaticamente: number;
  ativo: number;
  created_at: string;
  updated_at: string;
  categoria_nome?: string;
  fornecedor_nome?: string;
}

export interface ClienteContato {
  id: number;
  cliente_id: number;
  tipo: 'financeiro' | 'comercial' | 'outros';
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
  ativo: number;
}

export interface ClienteDadoBancario {
  id: number;
  cliente_id: number;
  favorecido: string;
  cnpj_cpf: string | null;
  banco: string;
  agencia: string | null;
  conta: string | null;
  operacao: string | null;
  pix: string | null;
  observacoes: string | null;
  ativo: number;
}

export interface ClienteCategoria {
  id: number;
  cliente_id: number;
  categoria: 'cliente' | 'fornecedor' | 'funcionario' | 'parceiro' | 'empresa' | 'outros';
}

export interface Cte {
  id: number;
  numero: string;
  serie: string | null;
  chave: string | null;
  cliente_id: number;
  data_emissao: string | null;
  valor_frete: number;
  origem: string | null;
  destino: string | null;
  minuta: string | null;
  emitente_cnpj: string | null;
  peso: number;
  cubagem: number;
  tipo_operacao: string | null;
  vencimento: string | null;
  centro_custo_id: number | null;
  arquivo_xml: string | null;
  status: string;
  ativo: number;
  created_at?: string;
  updated_at?: string;
  cliente_nome?: string;
}

export interface Manifesto {
  id: number;
  numero_manifesto: string;
  motorista_id: number | null;
  data_manifesto: string | null;
  data_saida_efetiva?: string | null;
  origem: string | null;
  destino: string | null;
  cliente: string | null;
  valor_frete: number;
  valor_despesa: number;
  valor_liquido: number;
  custo_adicional: number;
  custo_pedagio: number;
  custo_total?: number | null;
  quantidade_volumes: number;
  quantidade_entrega: number;
  entrega_realizada?: number | null;
  peso: number;
  peso_taxa: number;
  km: number;
  tipo_carga: string | null;
  tipo_servico: string | null;
  rota?: string | null;
  responsavel?: string | null;
  status: string;
  emissor?: string | null;
  tipo_rodado?: string | null;
  unidade?: string | null;
  total_nf?: number | null;
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
  created_by: number | null;
  motorista_nome?: string | null;
  motorista_placa?: string | null;
}

export type TarefaStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type TarefaPrioridade = 'baixa' | 'media' | 'alta';

export interface TarefaUnidade {
  id: number;
  nome: string;
  ordem: number;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  unidade_id: number | null;
  unidade_nome?: string | null;
  data_vencimento: string | null;
  responsavel_id: number | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  responsavel_nome?: string | null;
}

export interface DocumentoTipo {
  id: number;
  nome: string;
  ordem: number;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export interface Documento {
  id: number;
  nome: string;
  nome_arquivo: string;
  caminho: string;
  mime_type: string | null;
  tamanho: number;
  descricao: string | null;
  tipo_documento_id: number | null;
  tipo_documento_nome?: string | null;
  data_vencimento: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  created_by_nome?: string | null;
  can_view?: number;
  can_download?: number;
  can_edit?: number;
  can_delete?: number;
}

export interface DocumentoPermissao {
  id: number;
  document_id: number;
  user_id: number;
  can_view: number;
  can_download: number;
  can_edit: number;
  can_delete: number;
  user_nome?: string | null;
}

// --- Módulo Cotação de Frete ---
export type CotacaoParceiroTipo = 'RODOVIARIO' | 'AEREO' | 'AMBOS';

export interface CotacaoParceiro {
  id: number;
  nome: string;
  tipo: CotacaoParceiroTipo;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  ativo: number;
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface CotacaoParceiroCoverage {
  id: number;
  partner_id: number;
  uf: string;
  cidade: string;
  cep_inicio: string | null;
  cep_fim: string | null;
  created_at?: string;
}

export interface CotacaoPriceTable {
  id: number;
  partner_id: number;
  nome: string;
  origem_uf: string;
  origem_cidade: string;
  destino_uf: string;
  destino_cidade: string;
  ativo: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  partner_nome?: string;
}

export interface CotacaoPriceTableRange {
  id: number;
  price_table_id: number;
  peso_inicial_kg: number;
  peso_final_kg: number;
  valor_base: number;
  valor_excedente_por_kg: number | null;
  prazo_dias: number;
  created_at?: string;
  updated_at?: string;
}

export interface CotacaoPartnerFees {
  id: number;
  partner_id: number;
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
  created_at?: string;
  updated_at?: string;
}

export interface CotacaoPartnerTE {
  id: number;
  partner_id: number;
  codigo: string | null;
  minima: number;
  peso_franquia_kg: number;
  tarifa: number;
  soma_ao_frete_peso: number;
  created_at?: string;
  updated_at?: string;
}

export interface CepPraca {
  id: number;
  cep_inicio: string;
  cep_fim: string;
  uf: string;
  cidade: string;
}

export interface CotacaoQuote {
  id: number;
  origem_cep: string;
  destino_cep: string;
  origem_uf: string | null;
  origem_cidade: string | null;
  destino_uf: string | null;
  destino_cidade: string | null;
  tipo_carga: string | null;
  valor_nf: number;
  peso_real_kg: number;
  peso_cubado_kg: number;
  peso_tarifavel_kg: number;
  servico_ar: number;
  servico_mao_propria: number;
  servico_coleta: number;
  servico_entrega: number;
  servico_seguro: number;
  created_by: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CotacaoQuoteItem {
  id: number;
  quote_id: number;
  quantidade: number;
  altura_cm: number;
  largura_cm: number;
  comprimento_cm: number;
  peso_kg: number;
}

export interface CotacaoQuoteSelection {
  id: number;
  quote_id: number;
  partner_id: number;
  preco_final: number;
  prazo_dias: number;
  breakdown_json: Record<string, unknown> | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/** Composição da cotação conforme tabelas de preço (Valores + Composição + Frete Total). */
export interface QuoteBreakdown {
  tx_coleta: number;
  tx_pedagio: number;
  tx_gris: number;
  tas: number;
  tx_entrega: number;
  tx_tad: number;
  tx_peso_add: number;
  trt: number;
  pct_nf: number;
  advalorem: number;
  tx_redespacho: number;
  tde: number;
  frete_peso: number;
  outras_taxas: number;
  tx_despacho: number;
  set_cat: number;
  /** Soma dos valores (composição). */
  composicao: number;
  /** Peso médio usado (kg). */
  media_kg: number;
  subtotal: number;
  frete_total: number;
  /** Código do trecho (tabela de preço). */
  cod_trecho?: number;
}

export interface QuoteOption {
  partner_id: number;
  partner_nome: string;
  tipo: CotacaoParceiroTipo;
  prazo_dias: number;
  preco_final: number;
  /** Detalhamento por componente (compatível com tela de composição). */
  breakdown: QuoteBreakdown & Record<string, number>;
}
