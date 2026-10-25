import { apiCore } from './api';

/** GET /users/me → { id, name, email, primaryPhoneNumber, secondaryPhoneNumber, transport, role } */
export function buscarUsuario() {
  return apiCore.get('/users/me');
}

/**
 * PUT /users/me
 * @param {{ name: string, email: string, primaryPhoneNumber: string, secondaryPhoneNumber?: string,
 *   transport: { licensePlate: string, model: string, capacity: number } }} body
 */
export function atualizarUsuario(body) {
  return apiCore.put('/users/me', body);
}
