import { apiCore, definirToken } from './api';

/**
 * POST /auth/login
 * @returns {Promise<{ accessToken: string, expiresIn: number, username: string, userId: string, transportId: string }>}
 */
export async function entrar(email, password) {
  const resposta = await apiCore.post('/auth/login', { email, password }, { autenticado: false });
  definirToken(resposta.accessToken);
  return resposta;
}

/**
 * POST /auth/register
 * @param {{ name: string, email: string, password: string, phoneNumber: string,
 *   transport: { licensePlate: string, model: string, capacity: number } }} body
 */
export function cadastrar(body) {
  return apiCore.post('/auth/register', body, { autenticado: false });
}

/** POST /auth/forgot-password — solicita um código de 6 dígitos para recuperação de senha. */
export function solicitarRecuperacaoSenha(email) {
  return apiCore.post('/auth/forgot-password', { email }, { autenticado: false });
}

/**
 * POST /auth/reset-password — valida o código e redefine a senha do motorista.
 * @param {{ email: string, code: string, newPassword: string }} body
 */
export function redefinirSenha(body) {
  return apiCore.post('/auth/reset-password', body, { autenticado: false });
}

export function sair() {
  definirToken(null);
}
