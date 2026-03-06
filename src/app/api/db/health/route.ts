import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * Testa a conexão com o banco transportadora_financeiro.
 * Útil para verificar se o .env está correto e o MySQL está acessível.
 * Não exige autenticação (pode ser chamado antes do login).
 */

export const dynamic = 'force-static';

export async function GET() {
  try {
    await query<unknown[]>('SELECT 1 AS ok');
    const dbNameRows = await query<{ database: string }[]>(
      'SELECT DATABASE() AS database'
    );
    const name = Array.isArray(dbNameRows) && dbNameRows[0] ? dbNameRows[0].database : null;
    return NextResponse.json({
      success: true,
      message: 'Conexão com o banco OK',
      database: name ?? process.env.DB_DATABASE ?? 'transportadora_financeiro',
    });
  } catch (e) {
    console.error('DB health check:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha na conexão com o banco',
        detail: message,
      },
      { status: 503 }
    );
  }
}
