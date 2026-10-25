import {
  composicaoDespesas,
  dentroDoPeriodo,
  mesPorExtenso,
  periodoAtalho,
  resumoDoPeriodo,
} from '../utils/financeiro';
import { formatCurrency } from '../utils/formatters';
import { linkLocalizacao, normalizarTelefone } from '../utils/mensagens';
import { mockAlunosDetalhe, mockMotorista } from '../data/mock';

/*
 * Simula a ia-api com regras simples, só para a demonstração funcionar sem backend.
 * A API real usa um modelo de IA; o formato de entrada e saída é o mesmo (CONTRATO-IA.md).
 */

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const palavrasDe = (texto) => texto.split(/[^a-z0-9]+/).filter(Boolean);

// "não entrou" contém "entrou": ausência é testada primeiro, depois entrega, depois presença.
const AUSENTE =
  /\b(falt(ou|aram|a|ando)|ausentes?|nao (veio|vieram|vai|vao|entrou|entraram|subiu|subiram|embarcou|embarcaram|apareceu|apareceram|esta|estao|ta|tao))\b/;
const ENTREGUE =
  /\b(entreg(ue|ues|uei|amos|ou|aram)|deixei|desce(u|ram)|desembarc(ou|aram)|ficou na (escola|casa)|ficaram na (escola|casa))\b/;
const PRESENTE =
  /\b(entr(ou|aram|ando)|sub(iu|iram)|embarc(ou|aram)|cheg(ou|aram)|presentes?|na van|veio|vieram)\b/;
const CONSULTA_CHAMADA =
  /(quem (falta|ainda)|quantos (alunos|presentes|embarcaram|entraram)|faltam embarcar|chamada|a bordo)/;
const FINANCEIRO =
  /(financ|saldo|receit|despes|gast|lucr|dinheiro|mensalidad|receb|caixa|pag|mes passado|ultimo mes|este mes)/;
const ATRASO =
  /(transito|parad[oa]s?\b|congestion|engarrafa|atras(o|ad|ar|ei|ando)|acidente|demor|lentid|travad|esperando|aguardando)/;
const ESPERANDO_ALUNO = /(esperando|aguardando|na porta|em frente|na frente)/;
const COMBUSTIVEL = /(posto|abastec|combustiv|gasolina|etanol|alcool|diesel|encher o tanque)/;

const STATUS_FALADO = { PRESENTE: 'presente', AUSENTE: 'ausente', ENTREGUE: 'entregue' };

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

const statusDoTrecho = (trecho) =>
  AUSENTE.test(trecho) ? 'AUSENTE' : ENTREGUE.test(trecho) ? 'ENTREGUE' : PRESENTE.test(trecho) ? 'PRESENTE' : null;

/** "Enzo e Valentina entraram, deixei a Mariana na escola" → status por aluno. */
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
    const statusTrecho = statusDoTrecho(trecho);
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

const contarABordo = (presencas) => Object.values(presencas).filter((s) => s === 'PRESENTE').length;

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
    partes.push(`Pronto! Marquei ${acao.nomeAluno} como ${STATUS_FALADO[acao.status]}.`);
  } else if (acoes.length > 1) {
    const grupo = (status) => acoes.filter((a) => a.status === status).map((a) => primeiroNome(a.nomeAluno));
    const presentes = grupo('PRESENTE');
    const ausentes = grupo('AUSENTE');
    const entregues = grupo('ENTREGUE');
    partes.push(
      [
        'Pronto!',
        presentes.length && `Presentes: ${listar(presentes)}.`,
        ausentes.length && `Ausentes: ${listar(ausentes)}.`,
        entregues.length && `Entregues: ${listar(entregues)}.`,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

  if (acoes.length) {
    const presencas = { ...chamada.presencas };
    acoes.forEach((a) => (presencas[a.alunoId] = a.status));
    partes.push(`Agora são ${contarABordo(presencas)} de ${Object.keys(presencas).length} alunos na van.`);
  }
  ambiguos.forEach((nomes) => partes.push(`Tem mais de um aluno com esse nome: ${listar(nomes)}. Qual deles?`));
  if (semStatus.length) {
    partes.push(`Não entendi se ${listar(semStatus.map((a) => primeiroNome(a.nome)))} entrou na van, faltou ou foi entregue.`);
  }

  return { resposta: partes.join('\n'), acoes };
}

function responderChamada(chamada) {
  const comStatus = (status) => chamada.alunos.filter((a) => chamada.presencas[a.id] === status);
  const presentes = comStatus('PRESENTE');
  const entregues = comStatus('ENTREGUE');
  const faltam = comStatus('AUSENTE');
  const linhas = [`${chamada.nomeItinerario}: ${presentes.length} de ${chamada.alunos.length} alunos na van.`];
  if (entregues.length) linhas.push(`Já entregues: ${listar(entregues.map((a) => primeiroNome(a.nome)))}.`);
  if (faltam.length) linhas.push(`Ainda não embarcaram: ${listar(faltam.map((a) => primeiroNome(a.nome)))}.`);
  else linhas.push('Todos os alunos já embarcaram.');
  return linhas.join('\n');
}

/** Responsáveis do aluno com telefone, no formato de GET /alunos/{id} (`responsaveis[].tel1`). */
const responsaveisDe = (alunoId) => mockAlunosDetalhe[alunoId]?.responsaveis || [];

function montarRascunhos(alunos, motivo, montarTexto) {
  const acoes = [];
  const semTelefone = [];
  alunos.forEach((aluno) => {
    const responsaveis = responsaveisDe(aluno.id);
    if (!responsaveis.length) semTelefone.push(primeiroNome(aluno.nome));
    responsaveis.forEach((responsavel) => {
      const telefone = normalizarTelefone(responsavel.tel1) ?? normalizarTelefone(responsavel.tel2);
      if (!telefone) return semTelefone.push(primeiroNome(aluno.nome));
      acoes.push({
        tipo: 'ENVIAR_MENSAGEM_RESPONSAVEL',
        motivo,
        alunoId: aluno.id,
        nomeAluno: aluno.nome,
        responsavelNome: responsavel.nome,
        telefone,
        mensagem: montarTexto(aluno, responsavel),
      });
    });
  });
  return { acoes, semTelefone: [...new Set(semTelefone)] };
}

/** "Tô parado no trânsito" → rascunho para cada aluno a bordo; "esperando o Enzo" → só para o dele. */
function responderAtraso(textoNormalizado, citados, chamada, { localizacao, nomeMotorista }) {
  const apresentacao = `Aqui é o ${primeiroNome(nomeMotorista)}, motorista da van escolar.`;
  const local = localizacao ? ` Minha localização agora: ${linkLocalizacao(localizacao)}` : '';

  let motivo;
  let alunos;
  let montarTexto;
  if (citados.length) {
    motivo = 'ATRASO_ALUNO';
    alunos = citados;
    montarTexto = ESPERANDO_ALUNO.test(textoNormalizado)
      ? (aluno, resp) =>
          `Olá, ${primeiroNome(resp.nome)}! ${apresentacao} Estou aqui na frente aguardando ${primeiroNome(aluno.nome)}. Pode avisar que a van chegou?${local}`
      : (aluno, resp) =>
          `Olá, ${primeiroNome(resp.nome)}! ${apresentacao} Vamos atrasar um pouco no trajeto de ${primeiroNome(aluno.nome)}. Aviso assim que estivermos chegando.${local}`;
  } else {
    motivo = 'ATRASO_GERAL';
    alunos = chamada.alunos.filter((a) => chamada.presencas[a.id] === 'PRESENTE');
    if (!alunos.length) {
      return {
        resposta: 'Nenhum aluno está a bordo agora, então não preparei mensagens de atraso.',
        acoes: [],
      };
    }
    montarTexto = (aluno, resp) =>
      `Olá, ${primeiroNome(resp.nome)}! ${apresentacao} Estamos com atraso por causa do trânsito. Está tudo bem com ${primeiroNome(aluno.nome)}, que segue com a gente na van. Aviso quando estivermos chegando.${local}`;
  }

  const { acoes, semTelefone } = montarRascunhos(alunos, motivo, montarTexto);
  const partes = [];
  if (acoes.length) {
    const alunosComMensagem = new Set(acoes.map((a) => a.alunoId)).size;
    partes.push(
      `Preparei ${acoes.length === 1 ? 'a mensagem' : `${acoes.length} mensagens`} de atraso para os responsáveis de ` +
        `${alunosComMensagem === 1 ? primeiroNome(acoes[0].nomeAluno) : `${alunosComMensagem} alunos`}. ` +
        'Diga "pode mandar" ou toque em Enviar para abrir o WhatsApp.'
    );
  }
  if (semTelefone.length) partes.push(`Não encontrei telefone válido do responsável de ${listar(semTelefone)}.`);
  return { resposta: partes.join(' ') || 'Não encontrei responsáveis para avisar.', acoes };
}

const POSTOS_FICTICIOS = [
  { revenda: 'Auto Posto Avenida Ltda', bandeira: 'Ipiranga', endereco: 'Av. Paulista, 2100', bairro: 'Bela Vista' },
  { revenda: 'Posto Consolação', bandeira: 'Shell', endereco: 'Rua da Consolação, 3120', bairro: 'Cerqueira César' },
  { revenda: 'Auto Posto Jardins', bandeira: 'Branca', endereco: 'Rua Estados Unidos, 845', bairro: 'Jardim América' },
  { revenda: 'Posto Rebouças', bandeira: 'Petrobras', endereco: 'Av. Rebouças, 1560', bairro: 'Pinheiros' },
];
const PRECO_BASE = { GASOLINA: 5.79, ETANOL: 3.89, DIESEL: 5.99 };
const NOME_PRODUTO = { GASOLINA: 'gasolina', ETANOL: 'etanol', DIESEL: 'diesel' };

/** Coleta da ANP mais recente (fictícia): o sábado anterior a hoje. */
function dataColetaFicticia(hoje = new Date()) {
  const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 1) % 7 || 7));
  const doisDigitos = (n) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

function responderPostos(textoNormalizado) {
  const produto = /diesel/.test(textoNormalizado)
    ? 'DIESEL'
    : /(etanol|alcool)/.test(textoNormalizado)
      ? 'ETANOL'
      : 'GASOLINA';
  const postos = POSTOS_FICTICIOS.map((posto, i) => ({
    ...posto,
    municipio: 'São Paulo',
    precoVenda: Math.round((PRECO_BASE[produto] + [0.2, 0, 0.35, 0.12][i]) * 100) / 100,
  })).sort((a, b) => a.precoVenda - b.precoVenda);
  const [maisBarato] = postos;

  return {
    resposta:
      `O ${NOME_PRODUTO[produto]} mais barato perto de você está no ${maisBarato.revenda}, ` +
      `na ${maisBarato.endereco}, por ${formatCurrency(maisBarato.precoVenda)}. As outras opções estão na lista.`,
    acoes: [
      { tipo: 'SUGERIR_POSTOS', produto, municipio: 'São Paulo', dataColeta: dataColetaFicticia(), postos },
    ],
  };
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
  'Posso registrar presenças, avisar os responsáveis sobre atrasos, achar postos e consultar seu financeiro. Experimente:\n' +
  '• "O Enzo entrou na van"\n' +
  '• "Deixei a Valentina na escola"\n' +
  '• "Tô parado no trânsito"\n' +
  '• "Onde tem gasolina mais barata?"\n' +
  '• "Como está meu financeiro este mês?"';

/**
 * @param {{ conversaId: string|null, texto: string, itinerarioId: string|null,
 *           localizacao: { latitude: number, longitude: number } | null }} body
 * @param {{ chamada: Object|null, mensalidades: Object[], pagamentos: Object[], nomeMotorista?: string }} contexto
 */
export async function responderMock(body, { chamada, mensalidades, pagamentos, nomeMotorista }) {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const conversaId = body.conversaId ?? `mock-${Date.now()}`;
  const texto = normalizar(body.texto);
  const responder = (resposta, acoes = []) => ({ conversaId, resposta, acoes });

  if (COMBUSTIVEL.test(texto)) {
    const { resposta, acoes } = responderPostos(texto);
    return responder(resposta, acoes);
  }

  if (chamada) {
    const presencas = interpretarPresencas(body.texto, chamada.alunos);
    if (ATRASO.test(texto) && !FINANCEIRO.test(texto) && !presencas.marcacoes.length) {
      const citados = alunosNoTrecho(texto, chamada.alunos).encontrados;
      const { resposta, acoes } = responderAtraso(texto, citados, chamada, {
        localizacao: body.localizacao,
        nomeMotorista: nomeMotorista || mockMotorista.nome,
      });
      return responder(resposta, acoes);
    }
    const falouDePresenca =
      presencas.marcacoes.length ||
      presencas.ambiguos.length ||
      (presencas.semStatus.length && !FINANCEIRO.test(texto));
    if (falouDePresenca) {
      const { resposta, acoes } = responderPresencas(presencas, chamada);
      return responder(resposta, acoes);
    }
  }

  if (!chamada && ATRASO.test(texto) && !FINANCEIRO.test(texto)) {
    return responder('Nenhuma rota está em andamento. Inicie uma rota para eu preparar os avisos aos responsáveis.');
  }

  if (CONSULTA_CHAMADA.test(texto) || AUSENTE.test(texto) || ENTREGUE.test(texto) || PRESENTE.test(texto)) {
    if (!chamada) {
      return responder('Nenhuma rota está em andamento. Inicie uma rota na aba Itinerário para eu registrar as presenças.');
    }
    if (CONSULTA_CHAMADA.test(texto)) return responder(responderChamada(chamada));
  }

  if (FINANCEIRO.test(texto)) return responder(responderFinanceiro(texto, mensalidades, pagamentos));

  if (chamada && (AUSENTE.test(texto) || ENTREGUE.test(texto) || PRESENTE.test(texto))) {
    return responder(`Não encontrei esse aluno na ${chamada.nomeItinerario}.\n${responderChamada(chamada)}`);
  }

  return responder(AJUDA);
}
