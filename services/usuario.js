import { apiCore, fonteImagemAutenticada } from './api';

/** GET /users/me → { id, name, email, primaryPhoneNumber, secondaryPhoneNumber, transport, role, hasProfilePhoto } */
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

export function fonteFotoUsuario() {
  return fonteImagemAutenticada('/users/me/photo', Date.now());
}

export function atualizarFotoUsuario(asset) {
  const body = new FormData();
  body.append('file', {
    uri: asset.uri,
    name: asset.fileName || 'profile-photo.jpg',
    type: asset.mimeType || 'image/jpeg',
  });
  return apiCore.put('/users/me/photo', body);
}

export function removerFotoUsuario() {
  return apiCore.delete('/users/me/photo');
}
