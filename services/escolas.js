import { apiCore } from './api';

/** GET /schools → [{ id, name, educationLevel, address }] */
export function listarEscolas() {
  return apiCore.get('/schools');
}

/** GET /schools/{id} */
export function buscarEscola(id) {
  return apiCore.get(`/schools/${id}`);
}

/**
 * POST /schools — o back-end geocodifica o endereço.
 * @param {{ name: string, educationLevel: string, address: object }} body
 */
export function criarEscola(body) {
  return apiCore.post('/schools', body);
}

/** PUT /schools/{id} */
export function atualizarEscola(id, body) {
  return apiCore.put(`/schools/${id}`, body);
}

/** DELETE /schools/{id} (inativa a escola) */
export function excluirEscola(id) {
  return apiCore.delete(`/schools/${id}`);
}
