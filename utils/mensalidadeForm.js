import { brToISO, isoToBR, parseMoney } from './formatters';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Monta uma data DD/MM/AAAA no mês atual para o dia de vencimento do aluno,
 * ajustando para o último dia do mês quando necessário (ex.: dia 31 em fevereiro).
 * @param {number} dia
 * @param {Date} [base]
 */
export function sugerirVencimentoPorDia(dia, base = new Date()) {
  const numeroDia = Number(dia);
  if (!Number.isInteger(numeroDia) || numeroDia < 1 || numeroDia > 31) return '';
  const ano = base.getFullYear();
  const mes = base.getMonth();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  const diaAjustado = Math.min(numeroDia, ultimoDia);
  return isoToBR(`${ano}-${pad(mes + 1)}-${pad(diaAjustado)}`);
}

/**
 * Valida o valor do desconto frente ao valor atual da mensalidade.
 * Espelha AplicarDescontoUseCaseImpl (> 0 e estritamente menor que valorMensalidade).
 * @param {string} valorTexto texto formatado com maskMoney
 * @param {number} valorAtual
 * @returns {{ valorDesconto: number, erro: string | null }}
 */
export function validarDesconto(valorTexto, valorAtual) {
  const valorDesconto = parseMoney(valorTexto);
  const atual = Number(valorAtual);
  if (isNaN(valorDesconto) || valorDesconto <= 0) {
    return { valorDesconto: NaN, erro: 'Informe um desconto maior que zero.' };
  }
  if (!isNaN(atual) && valorDesconto >= atual) {
    return {
      valorDesconto,
      erro: 'O desconto deve ser menor que o valor atual da mensalidade.',
    };
  }
  return { valorDesconto, erro: null };
}

/**
 * Valida o formulário de criação de mensalidade avulsa conforme CriarMensalidadeUseCaseImpl.
 * @param {{ alunoId: string, valor: string, dataVencimento: string, status: string, valorPago: string, dataPagamento: string }} estado
 * @returns {Record<string, string>}
 */
export function validarNovaMensalidade(estado) {
  const errors = {};
  const valorMensalidade = parseMoney(estado.valor);
  const dataVencimento = brToISO(estado.dataVencimento);

  if (!estado.alunoId) errors.alunoId = 'Selecione um aluno';
  if (isNaN(valorMensalidade) || valorMensalidade <= 0) {
    errors.valor = 'Informe um valor maior que zero';
  }
  if (!dataVencimento) errors.dataVencimento = 'Informe uma data válida (DD/MM/AAAA)';

  if (estado.status === 'PAGO') {
    const valorPago = parseMoney(estado.valorPago);
    const dataPagamento = brToISO(estado.dataPagamento);
    if (isNaN(valorPago) || valorPago < 0) {
      errors.valorPago = 'Informe o valor pago';
    } else if (!isNaN(valorMensalidade) && valorPago > valorMensalidade) {
      errors.valorPago = 'Valor pago não pode ser maior que a mensalidade';
    }
    if (!dataPagamento) errors.dataPagamento = 'Informe a data do pagamento (DD/MM/AAAA)';
  }

  return errors;
}

/**
 * Converte o estado do formulário para MensalidadeRequest (POST /api/v1/mensalidades/criar).
 * @param {{ alunoId: string, valor: string, dataVencimento: string, status: string, valorPago: string, dataPagamento: string }} estado
 */
export function montarPayloadMensalidade(estado) {
  const pago = estado.status === 'PAGO';
  return {
    alunoId: estado.alunoId,
    valorMensalidade: parseMoney(estado.valor),
    dataVencimento: brToISO(estado.dataVencimento),
    status: estado.status || 'PENDENTE',
    valorPago: pago ? parseMoney(estado.valorPago) : null,
    dataPagamento: pago ? brToISO(estado.dataPagamento) : null,
  };
}
