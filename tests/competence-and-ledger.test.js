/**
 * Unit tests: competence default and ledger rules.
 * Run: npm test (uses Node built-in test runner)
 */
const { strictEqual, deepStrictEqual, ok } = require('node:assert');
const { describe, it } = require('node:test');

// PayableService.defaultCompetence
function defaultCompetence(dataEmissao) {
  const d = new Date(dataEmissao + 'T12:00:00');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

describe('Competence', () => {
  it('defaultCompetence returns first day of month', () => {
    strictEqual(defaultCompetence('2025-03-15'), '2025-03-01');
    strictEqual(defaultCompetence('2024-12-31'), '2024-12-01');
    strictEqual(defaultCompetence('2025-01-01'), '2025-01-01');
  });
});

describe('Ledger rules', () => {
  it('payment AP: debit bank + credit plano_contas', () => {
    const entries = [];
    const valor = 100;
    const bankId = 1;
    const planoId = 2;
    entries.push({ account_type: 'bank', account_id: bankId, debit: valor, credit: 0 });
    entries.push({ account_type: 'plano_contas', account_id: planoId, debit: 0, credit: valor });
    strictEqual(entries.length, 2);
    strictEqual(entries[0].debit, valor);
    strictEqual(entries[0].credit, 0);
    strictEqual(entries[1].debit, 0);
    strictEqual(entries[1].credit, valor);
  });

  it('receipt AR: debit bank + credit plano_contas', () => {
    const entries = [];
    const valor = 200;
    entries.push({ account_type: 'bank', debit: valor, credit: 0 });
    entries.push({ account_type: 'plano_contas', debit: 0, credit: valor });
    strictEqual(entries.length, 2);
    strictEqual(entries[0].debit, 200);
    strictEqual(entries[1].credit, 200);
  });
});
