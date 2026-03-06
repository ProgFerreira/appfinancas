import { redirect } from 'next/navigation';

export default function ParceiroNovoPage() {
  redirect('/cadastros/parceiros?novo=1');
}
