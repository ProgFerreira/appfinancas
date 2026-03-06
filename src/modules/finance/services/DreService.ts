import { DreRepository } from '../repositories/DreRepository';
import type { DreLine, DreParams } from '../repositories/DreRepository';

export interface DreResult {
  receitas: DreLine[];
  custosDespesas: DreLine[];
  totalReceitas: number;
  totalCustos: number;
  totalDespesas: number;
  resultado: number;
  periodo: { dataInicio: string; dataFim: string };
}

export class DreService {
  private repo = new DreRepository();

  async getByPeriod(params: DreParams): Promise<DreResult> {
    const [receitas, custosDespesas] = await Promise.all([
      this.repo.getReceitas(params),
      this.repo.getCustosDespesas(params),
    ]);
    const totalReceitas = receitas.reduce((s, r) => s + r.valor, 0);
    const totalCustos = custosDespesas.filter((c) => c.tipo === 'custo').reduce((s, c) => s + c.valor, 0);
    const totalDespesas = custosDespesas.filter((c) => c.tipo === 'despesa').reduce((s, c) => s + c.valor, 0);
    return {
      receitas,
      custosDespesas,
      totalReceitas,
      totalCustos,
      totalDespesas,
      resultado: totalReceitas - totalCustos - totalDespesas,
      periodo: { dataInicio: params.dataInicio, dataFim: params.dataFim },
    };
  }
}
