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

/** DELETE /students/{id} (inativa o aluno) */
export function excluirAluno(id) {
  return apiCore.delete(`/students/${id}`);
}
