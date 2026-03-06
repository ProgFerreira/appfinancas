/**
 * Domain types and enums for finance module.
 * StatusTitle, EventType, etc.
 */

export type StatusTitle = 'em_aberto' | 'parcial' | 'pago' | 'cancelado';

export type LedgerEventType =
  | 'payment_ap'
  | 'receipt_ar'
  | 'reversal_ap'
  | 'reversal_ar';

export type LedgerEntityType =
  | 'payable_payment'
  | 'receivable_receipt'
  | 'contas_pagar'
  | 'contas_receber';

export interface LedgerEntryRow {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: number;
  account_type: 'bank' | 'plano_contas';
  account_id: number;
  debit: number;
  credit: number;
  competence_date: string;
  occurred_at: string;
  metadata_json: string | null;
  created_at: string;
}
