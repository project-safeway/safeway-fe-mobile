import Constants from 'expo-constants';
import { router } from 'expo-router';

const PORTA_CORE = 8080;
const PORTA_FINANCEIRO = 8081;
const TEMPO_LIMITE_MS = 15000;

// Só em memória: fechar o app encerra a sessão.
let token = null;

export function definirToken(novoToken) {
  token = novoToken;
}

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

const host = () => {
  const valor = Constants.expoConfig?.extra?.api?.host;
  return typeof valor === 'string' && valor ? valor : null;
};

function montarQuery(query) {
  const partes = Object.entries(query || {})
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .flatMap(([chave, valor]) => (Array.isArray(valor) ? valor : [valor]).map((v) => [chave, v]))
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`);
  return partes.length ? `?${partes.join('&')}` : '';
}

/** O core responde erros em texto puro; a API financeira e o Spring respondem JSON com `message`. */
function detalheDoErro(texto) {
  try {
    const json = JSON.parse(texto);
    return json?.message || json?.error || '';
  } catch {
    return texto || '';
  }
}

function mensagemDeErro(status, detalhe) {
  if (/coordinates|address could not be found/i.test(detalhe)) {
    return 'Não foi possível localizar o endereço no mapa. Confira rua, número, bairro, cidade e CEP.';
  }
  if (status === 401) return 'E-mail ou senha inválidos.';
  if (status === 404) return 'Registro não encontrado.';
  if (status === 409) return 'E-mail ou placa já cadastrados.';
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.';
  return detalhe || `A API respondeu com erro ${status}.`;
}

async function requisicao(porta, caminho, { method = 'GET', body, query, autenticado = true } = {}) {
  const ip = host();
  if (!ip) throw new ErroApi('Configure API_HOST no .env com o IP da máquina do back-end e reinicie o Expo.', 0);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEMPO_LIMITE_MS);
  let response;
  try {
    response = await fetch(`http://${ip}:${porta}${caminho}${montarQuery(query)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(autenticado && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ErroApi(
      `Não foi possível conectar ao servidor em ${ip}:${porta}. Confira o API_HOST e se o celular está na mesma rede.`,
      0
    );
  } finally {
    clearTimeout(timer);
  }

  const texto = await response.text();

  if (!response.ok) {
    console.warn(`[api] ${method} ${caminho} → ${response.status}`, texto.slice(0, 300));
    if (response.status === 401 && autenticado && porta === PORTA_FINANCEIRO) {
      throw new ErroApi(
        'A API financeira recusou o login. Ela precisa usar o mesmo par de chaves RSA da API core.',
        401
      );
    }
    if (response.status === 401 && autenticado) {
      definirToken(null);
      router.replace('/login');
      throw new ErroApi('Sua sessão expirou. Entre novamente.', 401);
    }
    throw new ErroApi(mensagemDeErro(response.status, detalheDoErro(texto)), response.status);
  }

  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

const cliente = (porta) => ({
  get: (caminho, query) => requisicao(porta, caminho, { query }),
  post: (caminho, body, opcoes) => requisicao(porta, caminho, { method: 'POST', body, ...opcoes }),
  put: (caminho, body) => requisicao(porta, caminho, { method: 'PUT', body }),
  patch: (caminho, body, query) => requisicao(porta, caminho, { method: 'PATCH', body, query }),
  delete: (caminho) => requisicao(porta, caminho, { method: 'DELETE' }),
});

/** API core (Java/Spring): usuários, alunos, escolas, itinerários e chamadas. */
export const apiCore = cliente(PORTA_CORE);

/** API financeira: mensalidades e pagamentos (despesas). */
export const apiFinanceiro = cliente(PORTA_FINANCEIRO);
