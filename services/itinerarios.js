import { apiCore } from './api';

/** GET /routes → [{ id, name, startTime: 'HH:mm:ss', endTime, routeType: 'TO_SCHOOL'|'FROM_SCHOOL', active }] */
export function listarItinerarios() {
  return apiCore.get('/routes');
}

/** GET /routes/{id} */
export function buscarItinerario(id) {
  return apiCore.get(`/routes/${id}`);
}

/**
 * GET /routes/{id}/stops — alunos e escolas na ordem geral do trajeto.
 * → [{ type: 'ALUNO'|'ESCOLA', id, name, generalOrder, specificOrder, schoolName, classroom, guardianName, address }]
 */
export function buscarParadas(id) {
  return apiCore.get(`/routes/${id}/stops`);
}

/**
 * POST /routes
 * @param {{ name: string, startTime: string, endTime: string, routeType: string }} body
 */
export function criarItinerario(body) {
  return apiCore.post('/routes', body);
}

/**
 * PUT /routes/{id} — `stops` substitui todos os alunos e escolas do itinerário.
 * @param {{ name: string, startTime: string, endTime: string, routeType: string, active: boolean,
 *   stops: { type: 'ALUNO'|'ESCOLA', id: string, generalOrder: number, specificOrder: number }[] }} body
 */
export function atualizarItinerario(id, body) {
  return apiCore.put(`/routes/${id}`, body);
}

/** DELETE /routes/{id} (inativa o itinerário) */
export function excluirItinerario(id) {
  return apiCore.delete(`/routes/${id}`);
}
