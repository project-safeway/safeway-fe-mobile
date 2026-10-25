import Constants from 'expo-constants';
import { expirarSessao, obterToken } from './sessao';

const TEMPO_LIMITE_MS = 15000;

export class ErroApi extends Error {
  /** @param {string} mensagem @param {number} status */
  constructor(mensagem, status) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
  }
}

/** URL da safeway-core-api (CORE_API_URL), ou null para usar os mocks. */
export const coreApiUrl = () => {
  const url = Constants.expoConfig?.extra?.coreApi?.apiUrl;
  return typeof url === 'string' && url ? url : null;
};

export const usandoMockCore = () => !coreApiUrl();

const mensagemDoCorpo = (corpo) => {
  if (!corpo) return null;
  if (typeof corpo === 'string') return corpo.slice(0, 200);
  return corpo.detail || corpo.message || corpo.mensagem || corpo.error || null;
};

/**
 * fetch com JSON, `Authorization: Bearer` e tempo limite. 401 numa rota autenticada encerra a sessão.
 * @param {string} urlBase
 * @param {string} caminho começando com "/"
 * @param {{ method?: string, body?: any, autenticado?: boolean, tempoLimiteMs?: number }} [opcoes]
 */
export async function requisitar(urlBase, caminho, { method = 'GET', body, autenticado = true, tempoLimiteMs = TEMPO_LIMITE_MS } = {}) {
  const token = autenticado ? obterToken() : null;
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), tempoLimiteMs);

  let response;
  try {
    response = await fetch(`${urlBase}${caminho}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controle.signal,
    });
  } catch (error) {
    throw new ErroApi(
      error.name === 'AbortError' ? 'O servidor demorou para responder.' : 'Sem conexão com o servidor.',
      0
    );
  } finally {
    clearTimeout(timer);
  }

  const texto = await response.text().catch(() => '');
  let corpo = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }

  if (response.status === 401 && autenticado) {
    await expirarSessao();
    throw new ErroApi('Sua sessão expirou. Entre novamente.', 401);
  }
  if (!response.ok) {
    throw new ErroApi(mensagemDoCorpo(corpo) || `O servidor respondeu ${response.status}.`, response.status);
  }
  return corpo;
}

/** Atalho para a core-api. Só chame com `CORE_API_URL` preenchido. */
export const core = (caminho, opcoes) => requisitar(coreApiUrl(), caminho, opcoes);
