import { CashFlowRepository } from '../repositories/CashFlowRepository';
import type { CashFlowEntry, CashFlowParams } from '../repositories/CashFlowRepository';

export interface CashFlowResult {
  entradas: CashFlowEntry[];
  saidas: CashFlowEntry[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  periodo: { dataInicio: string; dataFim: string };
}

export interface DiaFluxo {
  data: string;
  entradasRealizadas: CashFlowEntry[];
  saidasRealizadas: CashFlowEntry[];
  entradasPrevistas: CashFlowEntry[];
  saidasPrevistas: CashFlowEntry[];
  totalEntradasRealizadas: number;
  totalSaidasRealizadas: number;
  totalEntradasPrevistas: number;
  totalSaidasPrevistas: number;
  saldoAcumulado: number;
}

export interface FluxoDiaADiaResult {
  saldoInicial: number;
  dias: DiaFluxo[];
  alertasFaltaCaixa: string[];
  periodo: { dataInicio: string; dataFim: string };
}

export class CashFlowService {
  private repo = new CashFlowRepository();

  async getByPeriod(params: CashFlowParams): Promise<CashFlowResult> {
    const [entradasContabeis, saidasContabeis, entradasExtrato, saidasExtrato] = await Promise.all([
      this.repo.getEntradas(params),
      this.repo.getSaidas(params),
      this.repo.getEntradasFromExtrato(params),
      this.repo.getSaidasFromExtrato(params),
    ]);
    const entradas = [...entradasContabeis, ...entradasExtrato].sort((a, b) => a.data.localeCompare(b.data));
    const saidas = [...saidasContabeis, ...saidasExtrato].sort((a, b) => a.data.localeCompare(b.data));
    const totalEntradas = entradas.reduce((s, e) => s + e.valor, 0);
    const totalSaidas = saidas.reduce((s, e) => s + e.valor, 0);
    return {
      entradas,
      saidas,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      periodo: { dataInicio: params.dataInicio, dataFim: params.dataFim },
    };
  }

  /**
   * Fluxo dia a dia: para cada dia no período, entradas/saídas realizadas e previstas + saldo acumulado.
   * Permite ver em quais dias o caixa fica negativo (falta dinheiro).
   */
  async getFluxoDiaADia(
    params: CashFlowParams,
    saldoInicialManual?: number | null
  ): Promise<FluxoDiaADiaResult> {
    const [entradasReal, saidasReal, entradasPrev, saidasPrev, saldoInicialCalc] = await Promise.all([
      this.repo.getEntradas(params),
      this.repo.getSaidas(params),
      this.repo.getEntradasPrevistas(params),
      this.repo.getSaidasPrevistas(params),
      this.repo.getSaldoInicialAntesDe(params.dataInicio, params.contaBancariaId),
    ]);

    const entradasExtrato = await this.repo.getEntradasFromExtrato(params).catch(() => [] as CashFlowEntry[]);
    const saidasExtrato = await this.repo.getSaidasFromExtrato(params).catch(() => [] as CashFlowEntry[]);
    const entradasRealizadas = [...entradasReal, ...entradasExtrato].sort((a, b) => a.data.localeCompare(b.data));
    const saidasRealizadas = [...saidasReal, ...saidasExtrato].sort((a, b) => a.data.localeCompare(b.data));

    const saldoInicial = saldoInicialManual != null ? saldoInicialManual : saldoInicialCalc;

    const dataInicio = new Date(params.dataInicio + 'T12:00:00');
    const dataFim = new Date(params.dataFim + 'T12:00:00');
    const dias: DiaFluxo[] = [];
    const alertasFaltaCaixa: string[] = [];
    let saldoCorrente = saldoInicial;

    for (let d = new Date(dataInicio); d <= dataFim; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().slice(0, 10);
      const entradasRealDia = entradasRealizadas.filter((e) => e.data === dataStr);
      const saidasRealDia = saidasRealizadas.filter((s) => s.data === dataStr);
      const entradasPrevDia = entradasPrev.filter((e) => e.data === dataStr);
      const saidasPrevDia = saidasPrev.filter((s) => s.data === dataStr);

      const totalEntradasRealizadas = entradasRealDia.reduce((s, e) => s + e.valor, 0);
      const totalSaidasRealizadas = saidasRealDia.reduce((s, e) => s + e.valor, 0);
      const totalEntradasPrevistas = entradasPrevDia.reduce((s, e) => s + e.valor, 0);
      const totalSaidasPrevistas = saidasPrevDia.reduce((s, e) => s + e.valor, 0);

      saldoCorrente += totalEntradasRealizadas - totalSaidasRealizadas + totalEntradasPrevistas - totalSaidasPrevistas;

      const dia: DiaFluxo = {
        data: dataStr,
        entradasRealizadas: entradasRealDia,
        saidasRealizadas: saidasRealDia,
        entradasPrevistas: entradasPrevDia,
        saidasPrevistas: saidasPrevDia,
        totalEntradasRealizadas,
        totalSaidasRealizadas,
        totalEntradasPrevistas,
        totalSaidasPrevistas,
        saldoAcumulado: saldoCorrente,
      };
      dias.push(dia);
      if (saldoCorrente < 0) alertasFaltaCaixa.push(dataStr);
    }

    return {
      saldoInicial,
      dias,
      alertasFaltaCaixa,
      periodo: { dataInicio: params.dataInicio, dataFim: params.dataFim },
    };
  }
}
