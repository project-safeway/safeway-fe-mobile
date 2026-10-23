import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { mockAlunosDetalhe, mockMensalidades, mockPagamentos } from '../data/mock';
import { hojeISO } from '../utils/financeiro';

const FinanceiroContext = createContext(null);

export function FinanceiroProvider({ children }) {
  const [mensalidades, setMensalidades] = useState(mockMensalidades);
  const [pagamentos, setPagamentos] = useState(mockPagamentos);

  /** PATCH /api/v1/mensalidades/pagar/{id} */
  const pagarMensalidade = useCallback(async (id) => {
    console.log('[mock] PATCH /api/v1/mensalidades/pagar/' + id);
    setMensalidades((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: 'PAGO', dataPagamento: hojeISO(), valorPago: m.valorMensalidade }
          : m
      )
    );
  }, []);

  /** PATCH /api/v1/mensalidades/cancelar/{id} */
  const cancelarMensalidade = useCallback(async (id) => {
    console.log('[mock] PATCH /api/v1/mensalidades/cancelar/' + id);
    setMensalidades((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'CANCELADO' } : m)));
  }, []);

  /** POST /api/v1/pagamentos/registrar — body: { dataPagamento, valorPagamento, descricao } */
  const criarPagamento = useCallback(async (body) => {
    console.log('[mock] POST /api/v1/pagamentos/registrar', body);
    setPagamentos((prev) => [...prev, { id: Math.max(0, ...prev.map((p) => p.id)) + 1, ...body }]);
  }, []);

  /** PATCH /api/v1/pagamentos/{id} — body: { dataPagamento, valorPagamento, descricao } */
  const atualizarPagamento = useCallback(async (id, body) => {
    console.log('[mock] PATCH /api/v1/pagamentos/' + id, body);
    setPagamentos((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
  }, []);

  /** DELETE /api/v1/pagamentos/{id} */
  const excluirPagamento = useCallback(async (id) => {
    console.log('[mock] DELETE /api/v1/pagamentos/' + id);
    setPagamentos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const nomeResponsavel = useCallback(
    (alunoId) => mockAlunosDetalhe[alunoId]?.responsaveis?.[0]?.nome ?? null,
    []
  );

  const value = useMemo(
    () => ({
      mensalidades,
      pagamentos,
      pagarMensalidade,
      cancelarMensalidade,
      criarPagamento,
      atualizarPagamento,
      excluirPagamento,
      nomeResponsavel,
    }),
    [
      mensalidades,
      pagamentos,
      pagarMensalidade,
      cancelarMensalidade,
      criarPagamento,
      atualizarPagamento,
      excluirPagamento,
      nomeResponsavel,
    ]
  );

  return <FinanceiroContext.Provider value={value}>{children}</FinanceiroContext.Provider>;
}

export function useFinanceiro() {
  const context = useContext(FinanceiroContext);
  if (!context) throw new Error('useFinanceiro precisa estar dentro de <FinanceiroProvider>');
  return context;
}
