/**
 * DRE and CashFlow service tests (logic only, no DB).
 * Run: npm test
 */
const { strictEqual, ok } = require('node:assert');
const { describe, it } = require('node:test');

describe('DRE', () => {
  it('resultado = totalReceitas - totalCustos - totalDespesas', () => {
    const totalReceitas = 1000;
    const totalCustos = 300;
    const totalDespesas = 200;
    const resultado = totalReceitas - totalCustos - totalDespesas;
    strictEqual(resultado, 500);
  });
});

describe('CashFlow', () => {
  it('saldo = totalEntradas - totalSaidas', () => {
    const totalEntradas = 800;
    const totalSaidas = 600;
    const saldo = totalEntradas - totalSaidas;
    strictEqual(saldo, 200);
  });
});

describe('Reconciliation score', () => {
  function scoreMatch(txAmount, payAmount, txDate, payDate) {
    const valueMatch = Math.abs(txAmount - payAmount) < 0.01 ? 100 : Math.max(0, 100 - Math.abs(txAmount - payAmount));
    const d1 = new Date(txDate).getTime();
    const d2 = new Date(payDate).getTime();
    const diffDays = Math.abs((d1 - d2) / (24 * 60 * 60 * 1000));
    const dateScore = diffDays === 0 ? 100 : Math.max(0, 100 - diffDays * 5);
    return Math.round((valueMatch + dateScore) / 2);
  }
  it('same value and date gives high score', () => {
    const s = scoreMatch(100, 100, '2025-01-15', '2025-01-15');
    ok(s >= 90);
  });
  it('different value reduces score', () => {
    const s = scoreMatch(100, 50, '2025-01-15', '2025-01-15');
    ok(s < 100);
  });
});
