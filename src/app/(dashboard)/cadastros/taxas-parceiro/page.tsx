import { redirect } from 'next/navigation';

export default function TaxasParceiroPage() {
  redirect('/cadastros/parceiros?tab=taxas');
}
