import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import * as apiFinanceiro from '../services/financeiro';
import { listarAlunos } from '../services/alunos';

const FinanceiroContext = createContext(null);

/** Executa a ação na API; em erro avisa o motorista e devolve false. */
async function tentar(acao) {
  try {
    await acao();
    return true;
  } catch (erro) {
    Alert.alert('Não foi possível concluir', erro.message);
    return false;
  }
}

export function FinanceiroProvider({ children }) {
  const [mensalidades, setMensalidades] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [responsaveis, setResponsaveis] = useState({});
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState(null);

  /** GET /api/v1/mensalidades, GET /api/v1/pagamentos e GET /students (nome do responsável) */
  const recarregar = useCallback(async () => {
    setErro(null);
    try {
      const [listaMensalidades, listaPagamentos] = await Promise.all([
        apiFinanceiro.listarMensalidades(),
        apiFinanceiro.listarPagamentos(),
      ]);
      setMensalidades(listaMensalidades);
      setPagamentos(listaPagamentos);
      setCarregado(true);
    } catch (e) {
      setErro(e);
      return;
    }
    listarAlunos()
      .then((alunos) =>
        setResponsaveis(Object.fromEntries(alunos.map((a) => [a.id, a.guardians?.[0]?.name])))
      )
      .catch((e) => console.warn('[financeiro] responsáveis indisponíveis:', e.message));
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  /** PATCH /api/v1/mensalidades/pagar/{id} */
  const pagarMensalidade = useCallback(
    (id) =>
      tentar(async () => {
        const atualizada = await apiFinanceiro.pagarMensalidade(id);
        setMensalidades((prev) => prev.map((m) => (m.id === id ? atualizada : m)));
      }),
    []
  );

  /** PATCH /api/v1/mensalidades/cancelar/{id} */
  const cancelarMensalidade = useCallback(
    (id) =>
      tentar(async () => {
        const atualizada = await apiFinanceiro.cancelarMensalidade(id);
        setMensalidades((prev) => prev.map((m) => (m.id === id ? atualizada : m)));
      }),
    []
  );

  /** POST /api/v1/pagamentos/registrar — body: { dataPagamento, valorPagamento, descricao } */
  const criarPagamento = useCallback(
    (body) =>
      tentar(async () => {
        const criado = await apiFinanceiro.registrarPagamento(body);
        setPagamentos((prev) => [...prev, criado]);
      }),
    []
  );

  /** PATCH /api/v1/pagamentos/{id} — body: { dataPagamento, valorPagamento, descricao } */
  const atualizarPagamento = useCallback(
    (id, body) =>
      tentar(async () => {
        const atualizado = await apiFinanceiro.atualizarPagamento(id, body);
        setPagamentos((prev) => prev.map((p) => (p.id === id ? atualizado : p)));
      }),
    []
  );

  /** DELETE /api/v1/pagamentos/{id} */
  const excluirPagamento = useCallback(
    (id) =>
      tentar(async () => {
        await apiFinanceiro.excluirPagamento(id);
        setPagamentos((prev) => prev.filter((p) => p.id !== id));
      }),
    []
  );

  const nomeResponsavel = useCallback((alunoId) => responsaveis[alunoId] ?? null, [responsaveis]);

  const value = useMemo(
    () => ({
      mensalidades,
      pagamentos,
      carregado,
      erro,
      recarregar,
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
      carregado,
      erro,
      recarregar,
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
