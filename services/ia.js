import Constants from 'expo-constants';
import { responderMock } from './iaMock';

/**
 * @typedef {Object} AcaoIA
 * @property {'MARCAR_PRESENCA'} tipo
 * @property {number} alunoId
 * @property {string} nomeAluno
 * @property {'PRESENTE'|'AUSENTE'} status
 */

/**
 * @typedef {Object} RespostaIA
 * @property {string} conversaId
 * @property {string} resposta texto mostrado ao motorista
 * @property {AcaoIA[]} acoes o que a IA já executou no banco; o app só reflete na tela
 */

const apiUrl = () => {
  const url = Constants.expoConfig?.extra?.ia?.apiUrl;
  return typeof url === 'string' && url ? url : null;
};

export const usandoMockIA = () => !apiUrl();

/**
 * POST /ia/mensagens — envia a transcrição; a API Python guarda o texto no histórico da conversa.
 * @param {{ conversaId: string|null, texto: string, itinerarioId: number|null }} body
 * @param {Object} contextoLocal dados das telas, usados só pelo mock (a API real consulta o banco)
 * @returns {Promise<RespostaIA>}
 */
export async function enviarMensagem(body, contextoLocal) {
  const url = apiUrl();
  if (!url) {
    console.log('[mock] POST /ia/mensagens', body);
    return responderMock(body, contextoLocal);
  }

  const response = await fetch(`${url}/ia/mensagens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || `API da IA respondeu ${response.status}`);

  return {
    conversaId: data.conversaId ?? body.conversaId,
    resposta: data.resposta ?? '',
    acoes: Array.isArray(data.acoes) ? data.acoes : [],
  };
}
