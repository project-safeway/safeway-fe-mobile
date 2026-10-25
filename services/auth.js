import { core, ErroApi, usandoMockCore } from './api';
import { limparSessao, salvarSessao } from './sessao';
import { mockMotorista } from '../data/mock';

/**
 * POST /auth/v2/login — `{ email, senha }` → `{ accessToken, expiresIn, nomeUsuario, userId, idTransporte }`.
 * Sem CORE_API_URL, entra direto com o motorista mockado.
 */
export async function entrar(email, senha) {
  if (usandoMockCore()) {
    console.log('[mock] POST /auth/v2/login', { email });
    await new Promise((resolve) => setTimeout(resolve, 500));
    return salvarSessao({ nomeUsuario: mockMotorista.nome });
  }

  try {
    const resposta = await core('/auth/v2/login', {
      method: 'POST',
      body: { email: email.trim(), senha },
      autenticado: false,
    });
    if (!resposta?.accessToken) throw new ErroApi('Resposta de login inválida.', 500);
    return salvarSessao(resposta);
  } catch (error) {
    if (error.status === 401) throw new ErroApi('E-mail ou senha incorretos.', 401);
    throw error;
  }
}

export async function sair() {
  await limparSessao();
}
