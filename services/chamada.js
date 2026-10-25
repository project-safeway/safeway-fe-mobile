import { core, usandoMockCore } from './api';
import { mockItinerarios } from '../data/mock';

/** "06:30:00" (java.sql.Time) → "06:30". */
const horario = (valor) => (typeof valor === 'string' ? valor.slice(0, 5) : valor ?? '');

const normalizarItinerario = (itinerario) => ({
  ...itinerario,
  horarioInicio: horario(itinerario.horarioInicio),
  horarioFim: horario(itinerario.horarioFim),
  alunos: itinerario.alunos || [],
  escolas: itinerario.escolas || [],
});

/** GET /itinerarios — itinerários do motorista, já com alunos e escolas. */
export async function listarItinerarios() {
  if (usandoMockCore()) return mockItinerarios;
  const lista = await core('/itinerarios');
  return (Array.isArray(lista) ? lista : []).filter((i) => i.ativo !== false).map(normalizarItinerario);
}

/** GET /itinerarios/{id} */
export async function buscarItinerario(id) {
  if (usandoMockCore()) {
    return mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0];
  }
  return normalizarItinerario(await core(`/itinerarios/${id}`));
}

/** GET /itinerarios/{id}/alunos — coordenadas do endereço de embarque de cada aluno. */
export async function buscarLocalizacoesDosAlunos(itinerarioId) {
  const lista = await core(`/itinerarios/${itinerarioId}/alunos`);
  return Array.isArray(lista) ? lista : [];
}

/**
 * POST /chamada/iniciar/{itinerarioId} — devolve a chamada EM_ANDAMENTO do itinerário (cria se não houver).
 * @returns {Promise<{ id: string|null, presencas: Object<string, string> }>}
 */
export async function iniciarChamadaApi(itinerarioId) {
  if (usandoMockCore()) {
    console.log(`[mock] POST /chamada/iniciar/${itinerarioId}`);
    return { id: null, presencas: {} };
  }
  const chamada = await core(`/chamada/iniciar/${itinerarioId}`, { method: 'POST' });
  const presencas = Object.fromEntries(
    (chamada?.alunos || []).filter((a) => a.aluno?.id && a.presenca).map((a) => [a.aluno.id, a.presenca])
  );
  return { id: chamada?.id ?? null, presencas };
}

/**
 * PUT /chamada/{chamadaId}/registrar-presenca — `{ "<alunoId>": "PRESENTE" | "AUSENTE" | "ENTREGUE" }`.
 * @param {string|null} chamadaId
 * @param {Object<string, 'PRESENTE'|'AUSENTE'|'ENTREGUE'>} presencas
 */
export async function registrarPresencas(chamadaId, presencas) {
  if (usandoMockCore() || !chamadaId) {
    console.log(`[mock] PUT /chamada/${chamadaId}/registrar-presenca`, presencas);
    return;
  }
  await core(`/chamada/${chamadaId}/registrar-presenca`, { method: 'PUT', body: presencas });
}

/**
 * PUT /chamada/alterar/{itinerarioId}?status=FINALIZADA|CANCELADA.
 * Na core-api o {id} desta rota é o do itinerário: ela procura a chamada EM_ANDAMENTO dele.
 */
export async function alterarStatusChamada(itinerarioId, status) {
  if (usandoMockCore()) {
    console.log(`[mock] PUT /chamada/alterar/${itinerarioId}?status=${status}`);
    return;
  }
  await core(`/chamada/alterar/${itinerarioId}?status=${status}`, { method: 'PUT' });
}
