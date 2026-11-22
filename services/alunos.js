import { apiCore } from './api';

/**
 * GET /students
 * → [{ id, name, professor, birthdate, grade, classroom, school: { id, name, educationLevel, address },
 *      monthlyFee, dueDate, guardians: [{ id, name, primaryPhoneNumber, secondaryPhoneNumber, email, address }] }]
 */
export function listarAlunos() {
  return apiCore.get('/students');
}

/** GET /students/{id} */
export function buscarAluno(id) {
  return apiCore.get(`/students/${id}`);
}

/**
 * POST /students — cria o aluno e os responsáveis; o endereço do responsável é geocodificado no back-end.
 * @param {{ name: string, professor: string, birthdate?: string, grade?: number, classroom?: string,
 *   monthlyFee: number, dueDate: number, schoolId: string, guardian: object[] }} body
 */
export function criarAluno(body) {
  return apiCore.post('/students', body);
}

/**
 * PUT /students/{id} — atualiza os dados do aluno (o back-end não atualiza os responsáveis por este endpoint).
 * @param {string} id
 * @param {object} body StudentRequest
 */
export function atualizarAluno(id, body) {
  return apiCore.put(`/students/${id}`, body);
}

/**
 * PUT /guardians/{id} — atualiza dados e endereço do responsável (re-geocodifica no back-end).
 * @param {string} id
 * @param {object} body GuardianRequest
 */
export function atualizarResponsavel(id, body) {
  return apiCore.put(`/guardians/${id}`, body);
}

/** GET /guardians — lista todos os responsáveis acessíveis ao motorista autenticado. */
export function listarResponsaveis() {
  return apiCore.get('/guardians');
}

/**
 * POST /guardians — cria um responsável avulso (o endereço é geocodificado no back-end).
 * @param {object} body GuardianRequest
 */
export function criarResponsavel(body) {
  return apiCore.post('/guardians', body);
}

/** PUT /students/{studentId}/guardians/{guardianId} — vincula um responsável existente ao aluno. */
export function vincularResponsavel(studentId, guardianId) {
  return apiCore.put(`/students/${studentId}/guardians/${guardianId}`);
}

/** DELETE /students/{studentId}/guardians/{guardianId} — remove somente o vínculo, sem excluir o responsável. */
export function desvincularResponsavel(studentId, guardianId) {
  return apiCore.delete(`/students/${studentId}/guardians/${guardianId}`);
}

/** Cria um novo responsável e já o vincula ao aluno informado. */
export async function criarEVincularResponsavel(studentId, body) {
  const criado = await criarResponsavel(body);
  await vincularResponsavel(studentId, criado.id);
  return criado;
}

/**
 * Atualiza a flag `address.principal` nos responsáveis necessários via PUT /guardians/{id}.
 * @param {{ id: string, payload: object }[]} atualizacoes retorno de `montarPayloadsDefinirPrincipal`
 */
export async function definirResponsavelPrincipal(atualizacoes = []) {
  for (const item of atualizacoes) {
    await atualizarResponsavel(item.id, item.payload);
  }
}

/**
 * Persiste a edição completa do aluno: atualiza/cria apenas os responsáveis alterados
 * (antes do aluno, pois a geocodificação do endereço pode falhar) e depois envia PUT /students/{id}.
 * @param {string} id
 * @param {object} payloadAluno StudentRequest
 * @param {{ id: string | null, payload: object }[]} [alteracoesResponsaveis]
 */
export async function atualizarAlunoCompleto(id, payloadAluno, alteracoesResponsaveis = []) {
  let responsavelSalvo = false;
  try {
    for (const item of alteracoesResponsaveis) {
      if (item.id) {
        await atualizarResponsavel(item.id, item.payload);
      } else {
        const criado = await criarResponsavel(item.payload);
        await vincularResponsavel(id, criado.id);
      }
      responsavelSalvo = true;
    }
    return await atualizarAluno(id, payloadAluno);
  } catch (erro) {
    if (responsavelSalvo) erro.parcial = true;
    throw erro;
  }
}

/** DELETE /students/{id} (inativa o aluno) */
export function excluirAluno(id) {
  return apiCore.delete(`/students/${id}`);
}
