import { colors } from '../constants/colors';

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const STATUS_MENSALIDADE = {
  PENDENTE: { label: 'Pendente', color: colors.warning, bg: '#FFF4E5' },
  PAGO: { label: 'Pago', color: colors.success, bg: colors.successBg },
  ATRASADO: { label: 'Atrasado', color: colors.error, bg: colors.errorBg },
  CANCELADO: { label: 'Cancelado', color: colors.textMuted, bg: colors.borderLight },
};

export const CATEGORIAS_DESPESA = [
  { key: 'combustivel', label: 'Combustível', color: colors.primary, termos: ['combust', 'gasolina', 'etanol', 'diesel', 'abastec', 'posto'] },
  { key: 'manutencao', label: 'Manutenção', color: colors.chartBrown, termos: ['manuten', 'oleo', 'pneu', 'revis', 'mecan', 'freio', 'peca', 'oficina'] },
  { key: 'seguro', label: 'Seguro', color: colors.primaryDark, termos: ['seguro'] },
  { key: 'outros', label: 'Outros', color: colors.chartLight, termos: [] },
];

const semAcento = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** O pagamento não tem categoria na API: ela é inferida pela descrição. */
export function categoriaDaDespesa(descricao) {
  const texto = semAcento(descricao);
  return (
    CATEGORIAS_DESPESA.find((c) => c.termos.some((termo) => texto.includes(termo))) ||
    CATEGORIAS_DESPESA[CATEGORIAS_DESPESA.length - 1]
  );
}

const pad = (n) => String(n).padStart(2, '0');
const toISO = (data) => `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;

export const hojeISO = () => toISO(new Date());

/** Período no formato da API (YYYY-MM-DD) para os atalhos do web: 'mes' | 'hoje' | 'ano'. */
export function periodoAtalho(atalho, base = new Date()) {
  const ano = base.getFullYear();
  if (atalho === 'hoje') {
    const hoje = toISO(base);
    return { dataInicio: hoje, dataFim: hoje };
  }
  if (atalho === 'ano') return { dataInicio: `${ano}-01-01`, dataFim: `${ano}-12-31` };
  return {
    dataInicio: toISO(new Date(ano, base.getMonth(), 1)),
    dataFim: toISO(new Date(ano, base.getMonth() + 1, 0)),
  };
}

export const dentroDoPeriodo = (iso, { dataInicio, dataFim }) =>
  Boolean(iso) && (!dataInicio || iso >= dataInicio) && (!dataFim || iso <= dataFim);

export function mesPorExtenso(base = new Date()) {
  const mes = base.toLocaleDateString('pt-BR', { month: 'long' });
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${base.getFullYear()}`;
}

/** Mesmo cálculo dos KPIs do web: receita = mensalidades PAGAS do período; despesas = pagamentos do período. */
export function resumoDoPeriodo(mensalidades, pagamentos, periodo) {
  const pagas = mensalidades.filter((m) => m.status === 'PAGO' && dentroDoPeriodo(m.dataVencimento, periodo));
  const despesasPeriodo = pagamentos.filter((p) => dentroDoPeriodo(p.dataPagamento, periodo));
  const receita = pagas.reduce((acc, m) => acc + (Number(m.valorMensalidade) || 0), 0);
  const despesas = despesasPeriodo.reduce((acc, p) => acc + (Number(p.valorPagamento) || 0), 0);
  return { receita, despesas, saldo: receita - despesas, mensalidadesRecebidas: pagas.length };
}

/** Receita x despesas dos últimos `quantidade` meses, do mais antigo ao atual. */
export function serieMensal(mensalidades, pagamentos, quantidade = 6, base = new Date()) {
  return Array.from({ length: quantidade }, (_, i) => {
    const data = new Date(base.getFullYear(), base.getMonth() - (quantidade - 1 - i), 1);
    const periodo = periodoAtalho('mes', data);
    const { receita, despesas } = resumoDoPeriodo(mensalidades, pagamentos, periodo);
    return { key: periodo.dataInicio, label: MESES_CURTOS[data.getMonth()], receita, despesas };
  });
}

export function composicaoDespesas(pagamentos) {
  const total = pagamentos.reduce((acc, p) => acc + (Number(p.valorPagamento) || 0), 0);
  const fatias = CATEGORIAS_DESPESA.map((categoria) => {
    const valor = pagamentos
      .filter((p) => categoriaDaDespesa(p.descricao).key === categoria.key)
      .reduce((acc, p) => acc + (Number(p.valorPagamento) || 0), 0);
    return { ...categoria, valor, percentual: total ? valor / total : 0 };
  });

  // Maior resto: os inteiros exibidos na legenda sempre somam 100%.
  const brutos = fatias.map((f) => f.percentual * 100);
  const inteiros = brutos.map(Math.floor);
  const faltam = total ? 100 - inteiros.reduce((a, b) => a + b, 0) : 0;
  brutos
    .map((bruto, i) => ({ i, resto: bruto - inteiros[i] }))
    .sort((a, b) => b.resto - a.resto)
    .slice(0, faltam)
    .forEach(({ i }) => (inteiros[i] += 1));

  return { total, fatias: fatias.map((f, i) => ({ ...f, percentualInteiro: inteiros[i] })) };
}

/** "Mariana Silva (Enzo)", como no protótipo; sem responsável, só o nome do aluno. */
export function tituloMensalidade(mensalidade, responsavel) {
  const primeiroNome = (mensalidade.nomeAluno || '').split(' ')[0];
  return responsavel ? `${responsavel} (${primeiroNome})` : mensalidade.nomeAluno || 'Aluno';
}
