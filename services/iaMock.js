import {
  composicaoDespesas,
  dentroDoPeriodo,
  mesPorExtenso,
  periodoAtalho,
  resumoDoPeriodo,
} from '../utils/financeiro';
import { formatCurrency } from '../utils/formatters';

/*
 * Simula a API Python com regras simples, só para a demonstração funcionar sem backend.
 * A API real vai usar um modelo de IA; o formato de entrada e saída é o mesmo.
 */

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const palavrasDe = (texto) => texto.split(/[^a-z0-9]+/).filter(Boolean);

// "não entrou" contém "entrou": ausência é testada primeiro.
const AUSENTE =
  /\b(falt(ou|aram|a|ando)|ausentes?|nao (veio|vieram|vai|vao|entrou|entraram|subiu|subiram|embarcou|embarcaram|apareceu|apareceram|esta|estao|ta|tao))\b/;
const PRESENTE =
  /\b(entr(ou|aram|ando)|sub(iu|iram)|embarc(ou|aram)|cheg(ou|aram)|presentes?|na van|veio|vieram)\b/;
const CONSULTA_CHAMADA =
  /(quem (falta|ainda)|quantos (alunos|presentes|embarcaram|entraram)|faltam embarcar|chamada)/;
const FINANCEIRO =
  /(financ|saldo|receit|despes|gast|lucr|dinheiro|mensalidad|receb|caixa|pag|mes passado|ultimo mes|este mes)/;

const primeiroNome = (nome) => String(nome || '').split(' ')[0];
const listar = (nomes) =>
  nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : nomes[0] ?? '';

/** Alunos citados no trecho, resolvendo xarás pelo sobrenome quando ele foi dito. */
function alunosNoTrecho(trecho, alunos) {
  const palavras = new Set(palavrasDe(trecho));
  const porPrimeiroNome = new Map();
  alunos.forEach((aluno) => {
    const [primeiro, ...resto] = palavrasDe(normalizar(aluno.nome));
    if (!palavras.has(primeiro)) return;
    porPrimeiroNome.set(primeiro, [...(porPrimeiroNome.get(primeiro) || []), { aluno, resto }]);
  });

  const encontrados = [];
  const ambiguos = [];
  porPrimeiroNome.forEach((candidatos) => {
    if (candidatos.length === 1) return encontrados.push(candidatos[0].aluno);
    const comSobrenome = candidatos.filter((c) => c.resto.some((p) => palavras.has(p)));
    if (comSobrenome.length === 1) encontrados.push(comSobrenome[0].aluno);
    else ambiguos.push(candidatos.map((c) => c.aluno.nome));
  });
  return { encontrados, ambiguos };
}

/** "Enzo e Valentina entraram, a Mariana faltou" → status por aluno. */
function interpretarPresencas(texto, alunos) {
  const trechos = normalizar(texto).split(/[,.;!?]| e | mas /);
  const status = new Map();
  const ambiguos = [];
  let pendentes = [];
  let ultimoStatus = null;

  trechos.forEach((trecho) => {
    const resultado = alunosNoTrecho(trecho, alunos);
    ambiguos.push(...resultado.ambiguos);
    pendentes.push(...resultado.encontrados);
    const statusTrecho = AUSENTE.test(trecho) ? 'AUSENTE' : PRESENTE.test(trecho) ? 'PRESENTE' : null;
    if (!statusTrecho) return;
    pendentes.forEach((aluno) => status.set(aluno.id, { aluno, status: statusTrecho }));
    pendentes = [];
    ultimoStatus = statusTrecho;
  });

  if (ultimoStatus) {
    pendentes.forEach((aluno) => status.set(aluno.id, { aluno, status: ultimoStatus }));
    pendentes = [];
  }
  return { marcacoes: [...status.values()], semStatus: pendentes, ambiguos };
}

function responderPresencas({ marcacoes, semStatus, ambiguos }, chamada) {
  const acoes = marcacoes.map(({ aluno, status }) => ({
    tipo: 'MARCAR_PRESENCA',
    alunoId: aluno.id,
    nomeAluno: aluno.nome,
    status,
  }));
  const partes = [];

  if (acoes.length === 1) {
    const [acao] = acoes;
    partes.push(`Pronto! Marquei ${acao.nomeAluno} como ${acao.status === 'PRESENTE' ? 'presente' : 'ausente'}.`);
  } else if (acoes.length > 1) {
    const presentes = acoes.filter((a) => a.status === 'PRESENTE').map((a) => primeiroNome(a.nomeAluno));
    const ausentes = acoes.filter((a) => a.status === 'AUSENTE').map((a) => primeiroNome(a.nomeAluno));
    partes.push(
      ['Pronto!', presentes.length && `Presentes: ${listar(presentes)}.`, ausentes.length && `Ausentes: ${listar(ausentes)}.`]
        .filter(Boolean)
        .join(' ')
    );
  }

  if (acoes.length) {
    const presencas = { ...chamada.presencas };
    acoes.forEach((a) => (presencas[a.alunoId] = a.status === 'PRESENTE'));
    const total = Object.keys(presencas).length;
    partes.push(`Agora são ${Object.values(presencas).filter(Boolean).length} de ${total} alunos na van.`);
  }
  ambiguos.forEach((nomes) => partes.push(`Tem mais de um aluno com esse nome: ${listar(nomes)}. Qual deles?`));
  if (semStatus.length) {
    partes.push(`Não entendi se ${listar(semStatus.map((a) => primeiroNome(a.nome)))} entrou na van ou faltou.`);
  }

  return { resposta: partes.join('\n'), acoes };
}

function responderChamada(chamada) {
  const presentes = chamada.alunos.filter((a) => chamada.presencas[a.id]);
  const faltam = chamada.alunos.filter((a) => !chamada.presencas[a.id]);
  const linhas = [`${chamada.nomeItinerario}: ${presentes.length} de ${chamada.alunos.length} alunos na van.`];
  if (faltam.length) linhas.push(`Ainda não embarcaram: ${listar(faltam.map((a) => primeiroNome(a.nome)))}.`);
  else linhas.push('Todos os alunos já embarcaram.');
  return linhas.join('\n');
}

function periodoPedido(texto) {
  const hoje = new Date();
  if (/mes passado|ultimo mes/.test(texto)) {
    const base = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return { periodo: periodoAtalho('mes', base), nome: `em ${mesPorExtenso(base).toLowerCase()}` };
  }
  if (/\b(ano|anual)\b/.test(texto)) {
    return { periodo: periodoAtalho('ano', hoje), nome: `em ${hoje.getFullYear()}` };
  }
  return { periodo: periodoAtalho('mes', hoje), nome: `em ${mesPorExtenso(hoje).toLowerCase()}` };
}

const STATUS_TEXTO = { PAGO: 'paga', PENDENTE: 'pendente', ATRASADO: 'atrasada', CANCELADO: 'cancelada' };

function responderMensalidadeDoAluno(texto, mensalidades) {
  const alunos = [...new Map(mensalidades.map((m) => [m.alunoId, { id: m.alunoId, nome: m.nomeAluno }])).values()];
  const { encontrados } = alunosNoTrecho(texto, alunos);
  if (encontrados.length !== 1) return null;

  const [aluno] = encontrados;
  const periodo = periodoAtalho('mes');
  const doMes = mensalidades.find((m) => m.alunoId === aluno.id && dentroDoPeriodo(m.dataVencimento, periodo));
  if (!doMes) return `Não encontrei mensalidade de ${aluno.nome} neste mês.`;

  const [ano, mes, dia] = doMes.dataVencimento.split('-');
  return (
    `A mensalidade de ${aluno.nome} deste mês é de ${formatCurrency(doMes.valorMensalidade)}, ` +
    `com vencimento em ${dia}/${mes}/${ano}, e está ${STATUS_TEXTO[doMes.status] ?? doMes.status.toLowerCase()}.`
  );
}

function responderFinanceiro(texto, mensalidades, pagamentos) {
  const doAluno = responderMensalidadeDoAluno(texto, mensalidades);
  if (doAluno) return doAluno;

  const { periodo, nome } = periodoPedido(texto);
  const { receita, despesas, saldo } = resumoDoPeriodo(mensalidades, pagamentos, periodo);
  const linhas = [
    `${nome.charAt(0).toUpperCase()}${nome.slice(1)} você recebeu ${formatCurrency(receita)} de mensalidades e gastou ${formatCurrency(despesas)}.`,
    `Saldo: ${formatCurrency(saldo)}${saldo < 0 ? ' (negativo)' : ''}.`,
  ];

  const abertas = mensalidades.filter(
    (m) => (m.status === 'PENDENTE' || m.status === 'ATRASADO') && dentroDoPeriodo(m.dataVencimento, periodo)
  );
  if (abertas.length) {
    const valorAberto = abertas.reduce((acc, m) => acc + (Number(m.valorMensalidade) || 0), 0);
    const atrasadas = abertas.filter((m) => m.status === 'ATRASADO').map((m) => primeiroNome(m.nomeAluno));
    linhas.push(
      `Ainda faltam receber ${formatCurrency(valorAberto)} de ${listar(abertas.map((m) => primeiroNome(m.nomeAluno)))}` +
        (atrasadas.length ? ` (em atraso: ${listar(atrasadas)}).` : '.')
    );
  }

  const { fatias } = composicaoDespesas(pagamentos.filter((p) => dentroDoPeriodo(p.dataPagamento, periodo)));
  const maior = [...fatias].sort((a, b) => b.valor - a.valor)[0];
  if (maior?.valor) linhas.push(`Sua maior despesa foi ${maior.label} (${maior.percentualInteiro}% do total).`);

  return linhas.join('\n');
}

const AJUDA =
  'Posso registrar presenças e consultar seu financeiro. Experimente:\n' +
  '• "O Enzo entrou na van"\n' +
  '• "A Valentina faltou hoje"\n' +
  '• "Quem ainda falta embarcar?"\n' +
  '• "Como está meu financeiro este mês?"';

/**
 * @param {{ conversaId: string|null, texto: string }} body
 * @param {{ chamada: Object|null, mensalidades: Object[], pagamentos: Object[] }} contexto
 */
export async function responderMock(body, { chamada, mensalidades, pagamentos }) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const conversaId = body.conversaId ?? `mock-${Date.now()}`;
  const texto = normalizar(body.texto);
  const responder = (resposta, acoes = []) => ({ conversaId, resposta, acoes });

  if (chamada) {
    const presencas = interpretarPresencas(body.texto, chamada.alunos);
    const falouDePresenca =
      presencas.marcacoes.length ||
      presencas.ambiguos.length ||
      (presencas.semStatus.length && !FINANCEIRO.test(texto));
    if (falouDePresenca) {
      const { resposta, acoes } = responderPresencas(presencas, chamada);
      return responder(resposta, acoes);
    }
  }

  if (CONSULTA_CHAMADA.test(texto) || AUSENTE.test(texto) || PRESENTE.test(texto)) {
    if (!chamada) {
      return responder('Nenhuma rota está em andamento. Inicie uma rota na aba Itinerário para eu registrar as presenças.');
    }
    if (CONSULTA_CHAMADA.test(texto)) return responder(responderChamada(chamada));
  }

  if (FINANCEIRO.test(texto)) return responder(responderFinanceiro(texto, mensalidades, pagamentos));

  if (chamada && (AUSENTE.test(texto) || PRESENTE.test(texto))) {
    return responder(`Não encontrei esse aluno na ${chamada.nomeItinerario}.\n${responderChamada(chamada)}`);
  }

  return responder(AJUDA);
}
