import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function TabelaPrecoIdPage({ params }: Props) {
  redirect('/cadastros/parceiros');
}
