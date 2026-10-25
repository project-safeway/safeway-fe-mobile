import Constants from 'expo-constants';
import { requisitar } from './api';
import { responderMock } from './iaMock';

/**
 * Ações devolvidas pela ia-api (ver CONTRATO-IA.md na pasta raiz dos repositórios).
 *
 * @typedef {Object} AcaoMarcarPresenca a API já gravou na core-api; o app só reflete na tela
 * @property {'MARCAR_PRESENCA'} tipo
 * @property {string} alunoId
 * @property {string} nomeAluno
 * @property {'PRESENTE'|'AUSENTE'|'ENTREGUE'} status
 *
 * @typedef {Object} AcaoEnviarMensagem rascunho: nada foi enviado; o motorista confirma no WhatsApp
 * @property {'ENVIAR_MENSAGEM_RESPONSAVEL'} tipo
 * @property {'ATRASO_GERAL'|'ATRASO_ALUNO'} motivo
 * @property {string} alunoId
 * @property {string} nomeAluno
 * @property {string} responsavelNome
 * @property {string} telefone só dígitos, com DDI 55
 * @property {string} mensagem
 *
 * @typedef {Object} Posto
 * @property {string} revenda
 * @property {string} bandeira
 * @property {string} endereco
 * @property {string} bairro
 * @property {string} municipio
 * @property {number} precoVenda
 *
 * @typedef {Object} AcaoSugerirPostos
 * @property {'SUGERIR_POSTOS'} tipo
 * @property {string} produto
 * @property {string} municipio
 * @property {string} dataColeta "AAAA-MM-DD"
 * @property {Posto[]} postos
 *
 * @typedef {AcaoMarcarPresenca|AcaoEnviarMensagem|AcaoSugerirPostos} AcaoIA
 */

/**
 * @typedef {Object} RespostaIA
 * @property {string} conversaId
 * @property {string} resposta texto curto, próprio para leitura em voz alta
 * @property {AcaoIA[]} acoes
 */

// O modelo pode encadear várias ferramentas (core-api, preços) antes de responder.
const TEMPO_LIMITE_IA_MS = 60000;

const apiUrl = () => {
  const url = Constants.expoConfig?.extra?.ia?.apiUrl;
  return typeof url === 'string' && url ? url : null;
};

export const usandoMockIA = () => !apiUrl();

/**
 * POST /ia/mensagens — com `Authorization: Bearer` (JWT da core-api).
 * @param {{ conversaId: string|null, texto: string, itinerarioId: string|null,
 *           localizacao: { latitude: number, longitude: number } | null }} body
 * @param {Object} contextoLocal dados das telas, usados só pelo mock (a API real consulta a core-api)
 * @returns {Promise<RespostaIA>}
 */
export async function enviarMensagem(body, contextoLocal) {
  const url = apiUrl();
  if (!url) {
    console.log('[mock] POST /ia/mensagens', body);
    return responderMock(body, contextoLocal);
  }

  const data = (await requisitar(url, '/ia/mensagens', { method: 'POST', body, tempoLimiteMs: TEMPO_LIMITE_IA_MS })) || {};
  return {
    conversaId: data.conversaId ?? body.conversaId,
    resposta: data.resposta ?? '',
    acoes: Array.isArray(data.acoes) ? data.acoes : [],
  };
}
