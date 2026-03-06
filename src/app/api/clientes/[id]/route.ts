import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Cliente } from '@/types';

const TIPOS_CADASTRO = ['cliente', 'fornecedor', 'funcionario', 'parceiro', 'empresa', 'outros'] as const;

function normalizarCnpjCpf(val: string): string {
  return (val || '').replace(/\D/g, '');
}

async function existeClienteComMesmoCnpjCpf(documentoNormalizado: string, excluirId: number): Promise<boolean> {
  if (documentoNormalizado.length < 11) return false;
  const rows = await query<{ id: number }[]>(
    `SELECT id FROM clientes WHERE ativo = 1
     AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(cnpj_cpf,''), '.', ''), '/', ''), '-', ''), ' ', '') = ?
     AND id != ? LIMIT 1`,
    [documentoNormalizado, excluirId]
  );
  return Array.isArray(rows) && rows.length > 0;
}

const CLASSIFICACOES = ['A', 'B', 'C'] as const;

type ValidatedCliente = {
  nome: string;
  razao_social: string | null;
  cnpj_cpf: string | null;
  inscricao_estadual: string | null;
  tipo_cadastro: string;
  tipo_parceiro: string | null;
  condicao_pagamento: string | null;
  dados_bancarios: string | null;
  classificacao: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  telefone_xml: string | null;
  observacoes: string | null;
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
};

function validarCliente(body: unknown): ValidatedCliente | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const razao_social = typeof b.razao_social === 'string' ? b.razao_social.trim() : '';
  if (!nome || !razao_social) return null;
  const tipo_cadastro = typeof b.tipo_cadastro === 'string' && TIPOS_CADASTRO.includes(b.tipo_cadastro as (typeof TIPOS_CADASTRO)[number])
    ? b.tipo_cadastro
    : 'cliente';
  const classificacao = typeof b.classificacao === 'string' && CLASSIFICACOES.includes(b.classificacao as (typeof CLASSIFICACOES)[number])
    ? b.classificacao
    : null;
  return {
    nome,
    razao_social: razao_social || null,
    cnpj_cpf: typeof b.cnpj_cpf === 'string' ? b.cnpj_cpf.trim() || null : null,
    inscricao_estadual: typeof b.inscricao_estadual === 'string' ? b.inscricao_estadual.trim() || null : null,
    tipo_cadastro,
    tipo_parceiro: typeof b.tipo_parceiro === 'string' ? b.tipo_parceiro.trim() || null : null,
    condicao_pagamento: typeof b.condicao_pagamento === 'string' ? b.condicao_pagamento.trim() || null : null,
    dados_bancarios: typeof b.dados_bancarios === 'string' ? b.dados_bancarios.trim() || null : null,
    classificacao,
    contato: typeof b.contato === 'string' ? b.contato.trim() || null : null,
    email: typeof b.email === 'string' ? b.email.trim() || null : null,
    telefone: typeof b.telefone === 'string' ? b.telefone.trim() || null : null,
    telefone_xml: typeof b.telefone_xml === 'string' ? b.telefone_xml.trim() || null : null,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    cep: typeof b.cep === 'string' ? b.cep.trim() || null : null,
    logradouro: typeof b.logradouro === 'string' ? b.logradouro.trim() || null : null,
    numero: typeof b.numero === 'string' ? b.numero.trim() || null : null,
    complemento: typeof b.complemento === 'string' ? b.complemento.trim() || null : null,
    bairro: typeof b.bairro === 'string' ? b.bairro.trim() || null : null,
    codigo_municipio: b.codigo_municipio != null && b.codigo_municipio !== '' ? parseInt(String(b.codigo_municipio), 10) : null,
    municipio: typeof b.municipio === 'string' ? b.municipio.trim() || null : null,
    uf: typeof b.uf === 'string' ? b.uf.trim() || null : null,
    codigo_pais: b.codigo_pais != null && b.codigo_pais !== '' ? parseInt(String(b.codigo_pais), 10) : null,
    pais: typeof b.pais === 'string' ? b.pais.trim() || null : null,
    prazo_pagamento: b.prazo_pagamento != null && b.prazo_pagamento !== '' ? parseInt(String(b.prazo_pagamento), 10) : null,
    tipo_cobranca: typeof b.tipo_cobranca === 'string' ? b.tipo_cobranca.trim() || null : null,
    pode_faturar: b.pode_faturar === false || b.pode_faturar === 0 ? 0 : 1,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    categoria_receita_id: b.categoria_receita_id != null && b.categoria_receita_id !== '' ? parseInt(String(b.categoria_receita_id), 10) : null,
    categoria_despesa_id: b.categoria_despesa_id != null && b.categoria_despesa_id !== '' ? parseInt(String(b.categoria_despesa_id), 10) : null,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    plano_contas_despesa_id: b.plano_contas_despesa_id != null && b.plano_contas_despesa_id !== '' ? parseInt(String(b.plano_contas_despesa_id), 10) : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
}


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<Cliente[]>(
      `SELECT id, nome, razao_social, cnpj_cpf, inscricao_estadual, tipo_cadastro, tipo_parceiro, condicao_pagamento,
              dados_bancarios, classificacao, contato, email, telefone, telefone_xml, observacoes,
              cep, logradouro, numero, complemento, bairro, codigo_municipio, municipio, uf, codigo_pais, pais,
              prazo_pagamento, tipo_cobranca, pode_faturar, centro_custo_id, categoria_receita_id, categoria_despesa_id,
              plano_contas_id, plano_contas_despesa_id, ativo, created_at, updated_at FROM clientes WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const cliente = Array.isArray(rows) ? rows[0] : null;
    if (!cliente) {
      return NextResponse.json({ success: false, error: 'Cliente não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cliente });
  } catch (e) {
    console.error('API clientes [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar cliente.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const data = validarCliente(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Nome e Razão social são obrigatórios.' }, { status: 400 });
    }
    const docNorm = data.cnpj_cpf ? normalizarCnpjCpf(data.cnpj_cpf) : '';
    if (docNorm.length >= 11) {
      const duplicado = await existeClienteComMesmoCnpjCpf(docNorm, idNum);
      if (duplicado) {
        return NextResponse.json(
          { success: false, error: 'Já existe um cliente ativo com este CNPJ/CPF.' },
          { status: 409 }
        );
      }
    }
    await query(
      `UPDATE clientes SET nome = ?, razao_social = ?, cnpj_cpf = ?, inscricao_estadual = ?, tipo_cadastro = ?, tipo_parceiro = ?, condicao_pagamento = ?,
        dados_bancarios = ?, classificacao = ?, contato = ?, email = ?, telefone = ?, telefone_xml = ?, observacoes = ?,
        cep = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, codigo_municipio = ?, municipio = ?, uf = ?, codigo_pais = ?, pais = ?,
        prazo_pagamento = ?, tipo_cobranca = ?, pode_faturar = ?, centro_custo_id = ?, categoria_receita_id = ?, categoria_despesa_id = ?,
        plano_contas_id = ?, plano_contas_despesa_id = ?, ativo = ? WHERE id = ?`,
      [
        data.nome,
        data.razao_social ?? null,
        data.cnpj_cpf ?? null,
        data.inscricao_estadual ?? null,
        data.tipo_cadastro,
        data.tipo_parceiro ?? null,
        data.condicao_pagamento ?? null,
        data.dados_bancarios ?? null,
        data.classificacao ?? null,
        data.contato ?? null,
        data.email ?? null,
        data.telefone ?? null,
        data.telefone_xml ?? null,
        data.observacoes ?? null,
        data.cep ?? null,
        data.logradouro ?? null,
        data.numero ?? null,
        data.complemento ?? null,
        data.bairro ?? null,
        data.codigo_municipio ?? null,
        data.municipio ?? null,
        data.uf ?? null,
        data.codigo_pais ?? null,
        data.pais ?? null,
        data.prazo_pagamento ?? null,
        data.tipo_cobranca ?? null,
        data.pode_faturar,
        data.centro_custo_id ?? null,
        data.categoria_receita_id ?? null,
        data.categoria_despesa_id ?? null,
        data.plano_contas_id ?? null,
        data.plano_contas_despesa_id ?? null,
        data.ativo,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API clientes [id] PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar cliente.' },
      { status: 500 }
    );
  }
}

/** Soft delete: define ativo = 0. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('UPDATE clientes SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir cliente.' },
      { status: 500 }
    );
  }
}
