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

export function sair() {
  definirToken(null);
}
