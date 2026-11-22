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
