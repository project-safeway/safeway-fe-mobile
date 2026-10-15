/**
 * Junta alunos e escolas de um itinerário numa lista única ordenada,
 * mesma regra do web: ordemGlobal, senão ordemEmbarque/ordemVisita.
 */
export function buildTrajeto(itinerario) {
  const alunos = (itinerario?.alunos || []).map((a) => ({
    key: `aluno-${a.alunoId}`,
    id: a.alunoId,
    tipo: 'aluno',
    nome: a.nomeAluno,
    escola: a.nomeEscola,
    responsavel: a.nomeResponsavel,
    ordemGlobal: a.ordemGlobal || a.ordemEmbarque || 0,
  }));
  const escolas = (itinerario?.escolas || []).map((e) => ({
    key: `escola-${e.escolaId}`,
    id: e.escolaId,
    tipo: 'escola',
    nome: e.nome,
    cidade: e.cidade,
    ordemGlobal: e.ordemGlobal || e.ordemVisita || 0,
  }));
  return [...alunos, ...escolas].sort((a, b) => a.ordemGlobal - b.ordemGlobal);
}

export function reindexTrajeto(list) {
  return list.map((item, index) => ({ ...item, ordemGlobal: index + 1 }));
}

/** Monta `paradas` no formato do PUT /itinerarios/{id}. */
export function toParadas(list) {
  let ordemAluno = 1;
  let ordemEscola = 1;
  return list.map((item, index) => ({
    tipo: item.tipo === 'aluno' ? 'ALUNO' : 'ESCOLA',
    id: item.id,
    ordemGlobal: index + 1,
    ordemEspecifica: item.tipo === 'aluno' ? ordemAluno++ : ordemEscola++,
  }));
}
