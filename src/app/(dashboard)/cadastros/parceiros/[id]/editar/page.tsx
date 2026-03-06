import { redirect } from 'next/navigation';

type Props = { params: Promise<{ id: string }> };

export default async function ParceiroEditarPage({ params }: Props) {
  const { id } = await params;
  redirect(`/cadastros/parceiros?id=${encodeURIComponent(id)}`);
}
