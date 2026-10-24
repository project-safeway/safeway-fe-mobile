/**
 * Converte as paradas de GET /routes/{id}/stops (já ordenadas pela API)
 * na lista usada pelas telas de edição e de rota.
 */
export function buildTrajeto(paradas) {
  return (paradas || []).map((parada, index) => {
    const tipo = parada.type === 'ESCOLA' ? 'escola' : 'aluno';
    return {
      key: `${tipo}-${parada.id}`,
      id: parada.id,
      tipo,
      nome: parada.name,
      escola: parada.schoolName,
      sala: parada.classroom,
      responsavel: parada.guardianName,
      cidade: parada.address?.city,
      address: parada.address,
      ordemGlobal: index + 1,
    };
  });
}

export function reindexTrajeto(list) {
  return list.map((item, index) => ({ ...item, ordemGlobal: index + 1 }));
}

/** Monta `stops` no formato do PUT /routes/{id}. */
export function toStops(list) {
  let ordemAluno = 1;
  let ordemEscola = 1;
  return list.map((item, index) => ({
    type: item.tipo === 'aluno' ? 'ALUNO' : 'ESCOLA',
    id: item.id,
    generalOrder: index + 1,
    specificOrder: item.tipo === 'aluno' ? ordemAluno++ : ordemEscola++,
  }));
}
