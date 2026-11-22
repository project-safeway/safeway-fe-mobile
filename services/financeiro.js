import { apiFinanceiro } from './api';

// As listas são paginadas; o app filtra e agrega tudo localmente.
const TODOS = { size: 1000 };

/** GET /api/v1/mensalidades → MensalidadeResponse[] */
export async function listarMensalidades() {
  const pagina = await apiFinanceiro.get('/api/v1/mensalidades', TODOS);
  return pagina?.content ?? [];
}

/** PATCH /api/v1/mensalidades/pagar/{id} */
export function pagarMensalidade(id) {
  return apiFinanceiro.patch(`/api/v1/mensalidades/pagar/${id}`);
}

/** PATCH /api/v1/mensalidades/cancelar/{id} */
export function cancelarMensalidade(id) {
  return apiFinanceiro.patch(`/api/v1/mensalidades/cancelar/${id}`);
}

/** PATCH /api/v1/mensalidades/desconto/{id}?valorDesconto= */
export function aplicarDescontoMensalidade(id, valorDesconto) {
  return apiFinanceiro.patch(`/api/v1/mensalidades/desconto/${id}`, undefined, { valorDesconto });
}

/**
 * POST /api/v1/mensalidades/criar
 * @param {{ alunoId: string, valorMensalidade: number, dataVencimento: string,
 *   status: 'PENDENTE'|'ATRASADO'|'PAGO', valorPago: number|null, dataPagamento: string|null }} body
 */
export function criarMensalidade(body) {
  return apiFinanceiro.post('/api/v1/mensalidades/criar', body);
}

/** GET /api/v1/pagamentos → PagamentoResponse[] */
export async function listarPagamentos() {
  const pagina = await apiFinanceiro.get('/api/v1/pagamentos', TODOS);
  return pagina?.content ?? [];
}

/** POST /api/v1/pagamentos/registrar — body: { dataPagamento, valorPagamento, descricao } */
export function registrarPagamento(body) {
  return apiFinanceiro.post('/api/v1/pagamentos/registrar', body);
}

/** PATCH /api/v1/pagamentos/{id} — body: { dataPagamento, valorPagamento, descricao } */
export function atualizarPagamento(id, body) {
  return apiFinanceiro.patch(`/api/v1/pagamentos/${id}`, body);
}

/** DELETE /api/v1/pagamentos/{id} */
export function excluirPagamento(id) {
  return apiFinanceiro.delete(`/api/v1/pagamentos/${id}`);
}
