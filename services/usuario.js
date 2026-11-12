import { File, Paths } from 'expo-file-system';
import { apiCore, ErroApi } from './api';

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

/** GET /users/me/photo — baixa com o mesmo token das demais chamadas. */
export async function carregarFotoUsuario() {
  const bytes = await apiCore.getBinario('/users/me/photo');
  const arquivo = new File(Paths.cache, `perfil-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`);
  arquivo.create();
  try {
    arquivo.write(bytes);
  } catch (erro) {
    descartarFotoTemporaria(arquivo);
    throw erro;
  }
  return arquivo;
}

export function descartarFotoTemporaria(arquivo) {
  try {
    if (arquivo?.exists) arquivo.delete();
  } catch (erro) {
    console.warn('[perfil] Não foi possível remover a foto temporária:', erro.message);
  }
}

/** PUT /users/me/photo — envia o arquivo binário como multipart. */
export async function atualizarFotoUsuario(asset) {
  const arquivo = new File(asset.uri);
  if (!arquivo.exists) {
    throw new ErroApi('A foto selecionada não está mais disponível. Selecione a imagem novamente.', 0);
  }
  const body = new FormData();
  body.append('file', arquivo, asset.fileName || arquivo.name);
  return apiCore.put('/users/me/photo', body);
}

export function removerFotoUsuario() {
  return apiCore.delete('/users/me/photo');
}
