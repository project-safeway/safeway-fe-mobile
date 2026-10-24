import { apiCore } from './api';

/**
 * @typedef {Object} Chamada
 * @property {string} id
 * @property {Object} route
 * @property {'IN_PROGRESS'|'FINISHED'|'CANCELLED'} status
 * @property {string} createdAt
 * @property {{ studentId: string, studentName: string, schoolName: string, classroom: string,
 *   presence: 'PRESENT'|'ABSENT', date: string }[]} presences
 */

/**
 * POST /routes/{routeId}/attendances — devolve a chamada em andamento, se já existir.
 * @returns {Promise<Chamada>}
 */
export function abrirChamada(routeId) {
  return apiCore.post(`/routes/${routeId}/attendances`);
}

/**
 * GET /routes/{routeId}/attendances (paginado)
 * @returns {Promise<Chamada[]>}
 */
export async function listarChamadas(routeId) {
  const pagina = await apiCore.get(`/routes/${routeId}/attendances`, { size: 100, sort: 'createdAt,desc' });
  return pagina?.content ?? [];
}

/**
 * PUT /attendances/{id}/presences
 * @param {Record<string, 'PRESENT'|'ABSENT'>} presencas studentId → status
 */
export function registrarPresencas(attendanceId, presencas) {
  return apiCore.put(`/attendances/${attendanceId}/presences`, presencas);
}

/** POST /attendances/{id}/finish */
export function finalizarChamada(attendanceId) {
  return apiCore.post(`/attendances/${attendanceId}/finish`);
}

/** POST /attendances/{id}/cancel */
export function cancelarChamada(attendanceId) {
  return apiCore.post(`/attendances/${attendanceId}/cancel`);
}
