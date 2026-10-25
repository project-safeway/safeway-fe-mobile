import { requireOptionalNativeModule } from 'expo';

// APK antigo (sem expo-secure-store) não tem o módulo: a sessão fica só na memória e some ao fechar o app.
const SecureStore = requireOptionalNativeModule('ExpoSecureStore') ? require('expo-secure-store') : null;

const CHAVE = 'safeway.sessao';

/**
 * @typedef {Object} Sessao
 * @property {string|null} accessToken JWT da core-api (null no modo mock)
 * @property {number|null} expiraEm timestamp (ms) em que o token expira
 * @property {string} nomeUsuario
 * @property {string|null} userId
 * @property {string|null} idTransporte
 */

/** @type {Sessao|null} */
let sessaoAtual = null;
let carregada = false;
const ouvintesExpiracao = new Set();

export const armazenamentoSeguroDisponivel = () => Boolean(SecureStore);

const expirada = (sessao) => Boolean(sessao?.expiraEm && Date.now() >= sessao.expiraEm);

/** Lê a sessão salva (uma vez por execução). Sessão expirada é apagada. */
export async function carregarSessao() {
  if (carregada) return sessaoAtual;
  carregada = true;
  try {
    const salvo = SecureStore ? await SecureStore.getItemAsync(CHAVE) : null;
    sessaoAtual = salvo ? JSON.parse(salvo) : sessaoAtual;
  } catch (error) {
    console.warn('[sessao] não consegui ler a sessão salva:', error.message);
  }
  if (expirada(sessaoAtual)) await limparSessao();
  return sessaoAtual;
}

/** @param {{ accessToken?: string, expiresIn?: number, nomeUsuario?: string, userId?: string, idTransporte?: string }} login */
export async function salvarSessao(login) {
  sessaoAtual = {
    accessToken: login.accessToken ?? null,
    expiraEm: login.expiresIn ? Date.now() + Number(login.expiresIn) * 1000 : null,
    nomeUsuario: login.nomeUsuario ?? '',
    userId: login.userId ?? null,
    idTransporte: login.idTransporte ?? null,
  };
  carregada = true;
  try {
    if (SecureStore) await SecureStore.setItemAsync(CHAVE, JSON.stringify(sessaoAtual));
  } catch (error) {
    console.warn('[sessao] não consegui salvar a sessão:', error.message);
  }
  return sessaoAtual;
}

export async function limparSessao() {
  sessaoAtual = null;
  try {
    if (SecureStore) await SecureStore.deleteItemAsync(CHAVE);
  } catch (error) {
    console.warn('[sessao] não consegui apagar a sessão:', error.message);
  }
}

export const obterSessao = () => sessaoAtual;
export const obterToken = () => (expirada(sessaoAtual) ? null : sessaoAtual?.accessToken ?? null);

/** Avisado quando a API responde 401: quem ouve leva o motorista de volta ao login. */
export function aoExpirarSessao(ouvinte) {
  ouvintesExpiracao.add(ouvinte);
  return () => ouvintesExpiracao.delete(ouvinte);
}

export async function expirarSessao() {
  const haviaSessao = Boolean(sessaoAtual);
  await limparSessao();
  if (haviaSessao) ouvintesExpiracao.forEach((ouvinte) => ouvinte());
}
