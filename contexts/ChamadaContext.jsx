import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { alterarStatusChamada, iniciarChamadaApi, registrarPresencas } from '../services/chamada';

const ChamadaContext = createContext(null);

/** @typedef {'PRESENTE'|'AUSENTE'|'ENTREGUE'} StatusPresenca */
export const STATUS_PRESENCA = ['PRESENTE', 'AUSENTE', 'ENTREGUE'];

/** Quantos alunos estão em cada status. "A bordo" = PRESENTE. */
export function contarPresencas(presencas = {}) {
  const valores = Object.values(presencas);
  return {
    aBordo: valores.filter((s) => s === 'PRESENTE').length,
    ausentes: valores.filter((s) => s === 'AUSENTE').length,
    entregues: valores.filter((s) => s === 'ENTREGUE').length,
    total: valores.length,
  };
}

/**
 * Chamada da rota em andamento: compartilhada entre a tela da rota e o assistente.
 * Aluno ainda não marcado conta como AUSENTE (mesma regra do web ao finalizar).
 */
export function ChamadaProvider({ children }) {
  const [chamada, setChamada] = useState(null);
  const chamadaRef = useRef(null);
  chamadaRef.current = chamada;
  const iniciandoRef = useRef(null);

  /** POST /chamada/iniciar/{itinerarioId}. Reaproveita a chamada já aberta do mesmo itinerário. */
  const iniciarChamada = useCallback(async (itinerario) => {
    const atual = chamadaRef.current;
    if (atual && String(atual.itinerarioId) === String(itinerario.id)) return atual;

    const chave = String(itinerario.id);
    if (iniciandoRef.current?.chave !== chave) {
      iniciandoRef.current = { chave, promessa: iniciarChamadaApi(itinerario.id) };
    }
    let resposta;
    try {
      resposta = await iniciandoRef.current.promessa;
    } finally {
      if (iniciandoRef.current?.chave === chave) iniciandoRef.current = null;
    }
    const jaAberta = chamadaRef.current;
    if (jaAberta && String(jaAberta.itinerarioId) === chave) return jaAberta;
    const { id, presencas: salvas } = resposta;
    const nova = {
      chamadaId: id,
      itinerarioId: itinerario.id,
      nomeItinerario: itinerario.nome,
      alunos: (itinerario.alunos || []).map((a) => ({ id: a.alunoId, nome: a.nomeAluno })),
      presencas: Object.fromEntries(
        (itinerario.alunos || []).map((a) => [a.alunoId, salvas[a.alunoId] ?? 'AUSENTE'])
      ),
    };
    chamadaRef.current = nova;
    setChamada(nova);
    return nova;
  }, []);

  /**
   * Atualiza a tela na hora e grava com PUT /chamada/{id}/registrar-presenca.
   * `sincronizar: false` quando a gravação já foi feita (ex.: ação da IA).
   * Se a gravação falhar, volta ao status anterior e repassa o erro.
   * @param {string|number} alunoId
   * @param {StatusPresenca} status
   */
  const marcarPresenca = useCallback(async (alunoId, status, { sincronizar = true } = {}) => {
    const atual = chamadaRef.current;
    if (!atual || !(alunoId in atual.presencas) || !STATUS_PRESENCA.includes(status)) return;
    const anterior = atual.presencas[alunoId];

    const aplicar = (valor) =>
      setChamada((c) =>
        c && c.itinerarioId === atual.itinerarioId ? { ...c, presencas: { ...c.presencas, [alunoId]: valor } } : c
      );

    aplicar(status);
    if (!sincronizar) return;
    try {
      await registrarPresencas(atual.chamadaId, { [alunoId]: status });
    } catch (error) {
      aplicar(anterior);
      throw error;
    }
  }, []);

  /** Grava todas as presenças e muda o status da chamada (PUT /chamada/alterar/{itinerarioId}). */
  const encerrarChamada = useCallback(async (status = 'FINALIZADA') => {
    const atual = chamadaRef.current;
    if (!atual) return;
    if (status === 'FINALIZADA') await registrarPresencas(atual.chamadaId, atual.presencas);
    await alterarStatusChamada(atual.itinerarioId, status);
    chamadaRef.current = null;
    setChamada(null);
  }, []);

  const value = useMemo(
    () => ({ chamada, iniciarChamada, marcarPresenca, encerrarChamada }),
    [chamada, iniciarChamada, marcarPresenca, encerrarChamada]
  );

  return <ChamadaContext.Provider value={value}>{children}</ChamadaContext.Provider>;
}

export function useChamada() {
  const context = useContext(ChamadaContext);
  if (!context) throw new Error('useChamada precisa estar dentro de <ChamadaProvider>');
  return context;
}
