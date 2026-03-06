'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Erro de conexão. O servidor não respondeu corretamente. Se o site está em hospedagem só de arquivos estáticos, é necessário rodar com Node.js para o login funcionar.');
        return;
      }
      if (!data.success) {
        setError(data.error ?? 'Erro ao entrar.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro de conexão. Verifique sua internet ou se o servidor está no ar. Em hospedagem estática (apenas pasta out/), o login só funciona com Node.js.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 py-5 text-white text-center">
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
            <span>🚛</span> Acesso ao Sistema
          </h1>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="seu@email.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-sm text-slate-500">
          Sistema Financeiro para Transportadoras
        </div>
      </div>
    </div>
  );
}
