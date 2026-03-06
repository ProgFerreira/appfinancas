import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { parseOfx } from '@/modules/bank/ofx/parser';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let importId = 0;
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'bank.import');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para importar OFX.' }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bankAccountIdStr = formData.get('bank_account_id');
    if (!file || !bankAccountIdStr) {
      return NextResponse.json(
        { success: false, error: 'Envie o arquivo OFX e a conta bancária.' },
        { status: 400 }
      );
    }
    const bankAccountId = parseInt(String(bankAccountIdStr), 10);
    if (!Number.isInteger(bankAccountId) || bankAccountId < 1) {
      return NextResponse.json({ success: false, error: 'Conta bancária inválida.' }, { status: 400 });
    }
    const content = await file.text();
    const rawContent = content.replace(/^\uFEFF/, '').trim();
    const transactions = parseOfx(rawContent);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      `INSERT INTO bank_statement_imports (bank_account_id, filename, imported_at, status, user_id)
       VALUES (?, ?, ?, 'processing', ?)`,
      [bankAccountId, file.name, now, userId]
    );
    const importIdRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    importId = Array.isArray(importIdRows) && importIdRows[0] ? Number(importIdRows[0].id) : 0;
    let inserted = 0;
    let skipped = 0;
    for (const tx of transactions) {
      try {
        await query(
          `INSERT INTO bank_transactions (bank_statement_import_id, bank_account_id, fit_id, posted_at, amount, type, memo, payee, raw_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            importId,
            bankAccountId,
            String(tx.fitId).slice(0, 128),
            tx.postedAt,
            tx.amount,
            tx.type,
            tx.memo != null ? String(tx.memo).slice(0, 255) : null,
            tx.payee != null ? String(tx.payee).slice(0, 255) : null,
            tx.raw ? JSON.stringify({ raw: tx.raw }) : null,
          ]
        );
        inserted++;
      } catch (err: unknown) {
        const mysqlErr = err as { code?: string; errno?: number; message?: string };
        const isDuplicate = mysqlErr.code === 'ER_DUP_ENTRY' || mysqlErr.errno === 1062;
        if (isDuplicate) {
          skipped++;
        } else {
          console.error('bank_transactions INSERT error:', mysqlErr.code, mysqlErr.errno, mysqlErr.message);
          throw err;
        }
      }
    }
    const statusMessage =
      transactions.length === 0
        ? 'Nenhuma transação encontrada no arquivo OFX.'
        : skipped > 0
          ? `Inseridas: ${inserted}, ignoradas (duplicidade): ${skipped}`
          : null;
    await query(
      `UPDATE bank_statement_imports SET status = 'done', error_message = ? WHERE id = ?`,
      [statusMessage, importId]
    );
    return NextResponse.json({
      success: true,
      data: { importId, total: transactions.length, inserted, skipped },
    });
  } catch (e) {
    console.error('API bank/import:', e);
    const message = e instanceof Error ? e.message : String(e);
    if (importId > 0) {
      try {
        await query(
          `UPDATE bank_statement_imports SET status = 'error', error_message = ? WHERE id = ?`,
          [message.slice(0, 1000), importId]
        );
      } catch (_) {}
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao importar OFX.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
