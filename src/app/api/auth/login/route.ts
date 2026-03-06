import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import type { UsuarioComSenha } from '@/types';


export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body as { email?: string; senha?: string };
    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const rows = await query<UsuarioComSenha[]>(
      'SELECT id, nome, email, senha_hash, perfil, status, ativo FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1',
      [email.trim().toLowerCase()]
    );
    const user = Array.isArray(rows) ? rows[0] : null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(senha, user.senha_hash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha inválidos.' },
        { status: 401 }
      );
    }

    if (user.status !== 'ativo') {
      return NextResponse.json(
        { success: false, error: 'Usuário inativo.' },
        { status: 403 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil },
    });
    response.cookies.set('session', createSession(user.id), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar login.' },
      { status: 500 }
    );
  }
}
