import { brToISO, isoToBR, maskCEP, maskMoney, maskPhone, parseMoney } from './formatters';
import { isRequired, isValidEmail, isValidPhone } from './validators';

const pad = (n) => String(n).padStart(2, '0');
const hojeLocalISO = (base = new Date()) =>
  `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;

/** Cria um responsável em branco no formato usado pelo formulário. */
export function criarResponsavelVazio() {
  return {
    id: null,
    nome: '',
    tel1: '',
    tel2: '',
    email: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      tipo: 'Residential',
      principal: true,
    },
  };
}

/** Converte um GuardianResponse da API para o estado editável do formulário. */
export function criarEstadoResponsavel(guardian) {
  if (!guardian) return criarResponsavelVazio();
  const address = guardian.address ?? {};
  return {
    id: guardian.id ?? null,
    nome: guardian.name ?? '',
    tel1: maskPhone(String(guardian.primaryPhoneNumber ?? '')),
    tel2: maskPhone(String(guardian.secondaryPhoneNumber ?? '')),
    email: guardian.email ?? '',
    endereco: {
      cep: maskCEP(String(address.zipCode ?? '')),
      logradouro: address.street ?? '',
      numero: address.number ?? '',
      complemento: address.additionalDetails ?? '',
      bairro: address.neighborhood ?? '',
      cidade: address.city ?? '',
      uf: String(address.federalUnit ?? '').toUpperCase().slice(0, 2),
      tipo: address.type || 'Residential',
      principal: address.principal ?? true,
    },
  };
}

/**
 * Converte um StudentResponse (ou vazio no cadastro) para o estado do formulário.
 * @param {Object} [aluno]
 */
export function criarEstadoInicialAluno(aluno) {
  const guardians = aluno?.guardians?.length
    ? aluno.guardians.map(criarEstadoResponsavel)
    : [criarResponsavelVazio()];

  return {
    nome: aluno?.name ?? '',
    nascimento: aluno?.birthdate ? isoToBR(aluno.birthdate) : '',
    professor: aluno?.professor ?? '',
    escolaId: aluno?.school?.id ?? '',
    serie: aluno?.grade !== null && aluno?.grade !== undefined ? String(aluno.grade) : '',
    sala: aluno?.classroom ?? '',
    mensalidade:
      aluno?.monthlyFee !== null && aluno?.monthlyFee !== undefined
        ? maskMoney(Number(aluno.monthlyFee).toFixed(2))
        : '',
    vencimentoDia:
      aluno?.dueDate !== null && aluno?.dueDate !== undefined ? String(aluno.dueDate) : '5',
    responsaveis: guardians,
  };
}

/**
 * Valida um único responsável (dados de contato + endereço).
 * @param {ReturnType<typeof criarResponsavelVazio>} resp
 * @returns {Record<string, string>}
 */
export function validarResponsavel(resp) {
  const errors = {};
  const end = resp?.endereco || {};
  if (!isRequired(resp?.nome)) errors.nome = 'Obrigatório';
  else if (resp.nome.trim().length > 45) errors.nome = 'Máximo de 45 caracteres';
  if (!isValidPhone(resp?.tel1)) errors.tel1 = 'Telefone inválido';
  if (resp?.tel2 && !isValidPhone(resp.tel2)) errors.tel2 = 'Telefone inválido';
  if (resp?.email && !isValidEmail(resp.email)) errors.email = 'E-mail inválido';
  if (String(end.cep || '').replace(/\D/g, '').length !== 8) errors.cep = 'CEP inválido';
  if (!isRequired(end.logradouro)) errors.logradouro = 'Obrigatório';
  if (!isRequired(end.numero)) errors.numero = 'Obrigatório';
  if (!isRequired(end.bairro)) errors.bairro = 'Obrigatório';
  if (!isRequired(end.cidade)) errors.cidade = 'Obrigatório';
  if (String(end.uf || '').trim().length !== 2) errors.uf = 'Obrigatório';
  return errors;
}

/**
 * Retorna o responsável principal do aluno (com `address.principal === true`), ou o primeiro da lista.
 * Espelha a ordenação de fallback do RouteStudentService.resolveStudentAddress na core-api.
 * @param {object[]} guardians GuardianResponse[]
 */
export function responsavelPrincipal(guardians = []) {
  if (!guardians?.length) return null;
  return guardians.find((g) => g?.address?.principal === true) ?? guardians[0];
}

/**
 * Monta os payloads mínimos de PUT /guardians/{id} para definir um responsável como principal
 * e desmarcar qualquer outro responsável do aluno que estivesse marcado como principal.
 * @param {object[]} guardians GuardianResponse[]
 * @param {string} guardianIdEscolhido
 * @returns {{ id: string, payload: object }[]}
 */
export function montarPayloadsDefinirPrincipal(guardians = [], guardianIdEscolhido) {
  return (guardians || [])
    .filter((g) => g?.id && g?.address)
    .flatMap((g) => {
      const deveSerPrincipal = g.id === guardianIdEscolhido;
      const jaEhPrincipal = Boolean(g.address.principal);
      if (deveSerPrincipal === jaEhPrincipal) return [];
      const estado = criarEstadoResponsavel(g);
      estado.endereco.principal = deveSerPrincipal;
      return [{ id: g.id, payload: montarPayloadResponsavel(estado) }];
    });
}

/**
 * Filtra os responsáveis cadastrados que ainda não estão vinculados ao aluno, ordenados por nome.
 * @param {object[]} todosResponsaveis GuardianResponse[]
 * @param {object[]} vinculados GuardianResponse[]
 */
export function responsaveisDisponiveisParaVincular(todosResponsaveis = [], vinculados = []) {
  const idsVinculados = new Set((vinculados || []).map((g) => g.id));
  return (todosResponsaveis || [])
    .filter((g) => g?.id && !idsVinculados.has(g.id))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Valida o formulário de aluno (dados do estudante e de cada responsável).
 * @param {ReturnType<typeof criarEstadoInicialAluno>} estado
 * @param {string} [hoje] data atual em "YYYY-MM-DD"
 * @returns {Record<string, string>}
 */
export function validarFormularioAluno(estado, hoje = hojeLocalISO()) {
  const errors = {};
  const birthdate = estado.nascimento ? brToISO(estado.nascimento) : null;
  const monthlyFee = parseMoney(estado.mensalidade);
  const dueDate = Number(estado.vencimentoDia);

  if (!isRequired(estado.nome)) errors.nome = 'Obrigatório';
  if (estado.nascimento && (!birthdate || birthdate >= hoje)) {
    errors.nascimento = 'Informe uma data válida no passado';
  }
  if (!isRequired(estado.professor)) errors.professor = 'Obrigatório';
  if (!estado.escolaId) errors.escolaId = 'Selecione uma escola';
  if (isNaN(monthlyFee) || monthlyFee <= 0) errors.mensalidade = 'Informe um valor maior que zero';
  if (!Number.isInteger(dueDate) || dueDate < 1 || dueDate > 31) {
    errors.vencimentoDia = 'Informe um dia entre 1 e 31';
  }

  (estado.responsaveis || []).forEach((resp, index) => {
    const prefix = `resp_${index}_`;
    const errosResp = validarResponsavel(resp);
    Object.entries(errosResp).forEach(([campo, mensagem]) => {
      errors[`${prefix}${campo}`] = mensagem;
    });
  });

  return errors;
}

/** Converte um responsável do formulário para GuardianRequest. */
export function montarPayloadResponsavel(resp) {
  const end = resp.endereco;
  return {
    name: resp.nome.trim(),
    primaryPhoneNumber: resp.tel1.replace(/\D/g, ''),
    secondaryPhoneNumber: resp.tel2 ? resp.tel2.replace(/\D/g, '') || null : null,
    email: resp.email.trim() || null,
    address: {
      street: end.logradouro.trim(),
      number: end.numero.trim(),
      additionalDetails: end.complemento.trim() || null,
      neighborhood: end.bairro.trim(),
      city: end.cidade.trim(),
      federalUnit: end.uf.trim().toUpperCase(),
      zipCode: end.cep.replace(/\D/g, ''),
      type: end.tipo || 'Residential',
      principal: end.principal ?? true,
    },
  };
}

/** Converte o estado do formulário para StudentRequest. */
export function montarPayloadAluno(estado) {
  return {
    name: estado.nome.trim(),
    professor: estado.professor.trim(),
    birthdate: estado.nascimento ? brToISO(estado.nascimento) : null,
    grade: estado.serie ? Number(estado.serie) : null,
    classroom: estado.sala.trim() || null,
    monthlyFee: parseMoney(estado.mensalidade),
    dueDate: Number(estado.vencimentoDia),
    schoolId: estado.escolaId,
    guardian: estado.responsaveis.map(montarPayloadResponsavel),
  };
}

/**
 * Retorna apenas os responsáveis novos (sem id) ou que tiveram campos alterados.
 * Evita disparar PUT /guardians/{id} (e re-geocodificação no Google) sem necessidade.
 * @param {object[]} responsaveisOriginais GuardianResponse[]
 * @param {ReturnType<typeof criarEstadoResponsavel>[]} responsaveisAtuais
 * @returns {{ id: string | null, payload: object }[]}
 */
export function responsaveisParaSalvar(responsaveisOriginais = [], responsaveisAtuais = []) {
  const originaisPorId = new Map(
    responsaveisOriginais
      .filter((g) => g?.id)
      .map((g) => [g.id, JSON.stringify(montarPayloadResponsavel(criarEstadoResponsavel(g)))])
  );

  return responsaveisAtuais
    .map((resp) => ({ id: resp.id ?? null, payload: montarPayloadResponsavel(resp) }))
    .filter(({ id, payload }) => !id || originaisPorId.get(id) !== JSON.stringify(payload));
}
