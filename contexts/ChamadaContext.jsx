import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as apiChamadas from '../services/chamadas';

const ChamadaContext = createContext(null);

/**
 * Chamada da rota em andamento: compartilhada entre a tela da rota e o assistente.
 * Estado: { id, itinerarioId, nomeItinerario, alunos: [{ id, nome }], presencas: { [alunoId]: boolean } }
 */
export function ChamadaProvider({ children }) {
  const [chamada, setChamadaState] = useState(null);
  const chamadaRef = useRef(null);
  const filaRef = useRef(Promise.resolve());
  const abrindoRef = useRef(null);

  const setChamada = useCallback((atualizar) => {
    const proxima = typeof atualizar === 'function' ? atualizar(chamadaRef.current) : atualizar;
    chamadaRef.current = proxima;
    setChamadaState(proxima);
  }, []);

  /** As presenças precisam chegar na ordem dos toques, então os envios saem um de cada vez. */
  const enfileirar = useCallback((tarefa) => {
    const execucao = filaRef.current.then(tarefa);
    filaRef.current = execucao.catch(() => {});
    return execucao;
  }, []);

  /**
   * Abre (ou retoma) a chamada do itinerário: POST /routes/{id}/attendances.
   * @param {{ id: string, name: string }} itinerario RouteResponse
   * @param {{ id: string, nome: string }[]} alunos alunos do trajeto, na ordem das paradas
   */
  const iniciarChamada = useCallback(
    (itinerario, alunos) => {
      if (chamadaRef.current?.itinerarioId === itinerario.id) return Promise.resolve();
      if (abrindoRef.current?.itinerarioId === itinerario.id) return abrindoRef.current.promessa;

      const promessa = apiChamadas
        .abrirChamada(itinerario.id)
        .then((aberta) => {
          const registradas = Object.fromEntries(
            (aberta.presences || []).map((p) => [p.studentId, p.presence === 'PRESENT'])
          );
          setChamada({
            id: aberta.id,
            itinerarioId: itinerario.id,
            nomeItinerario: itinerario.name,
            alunos,
            presencas: Object.fromEntries(alunos.map((a) => [a.id, Boolean(registradas[a.id])])),
          });
        })
        .finally(() => {
          if (abrindoRef.current?.promessa === promessa) abrindoRef.current = null;
        });
      abrindoRef.current = { itinerarioId: itinerario.id, promessa };
      return promessa;
    },
    [setChamada]
  );

  /** PUT /attendances/{id}/presences com { [alunoId]: 'PRESENT' | 'ABSENT' } a cada toque. */
  const marcarPresenca = useCallback(
    (alunoId, presente) => {
      const atual = chamadaRef.current;
      if (!atual || !(alunoId in atual.presencas)) return;
      const anterior = atual.presencas[alunoId];
      const alterar = (valor) =>
        setChamada((c) =>
          c?.id === atual.id ? { ...c, presencas: { ...c.presencas, [alunoId]: valor } } : c
        );

      alterar(presente);
      enfileirar(() =>
        apiChamadas.registrarPresencas(atual.id, { [alunoId]: presente ? 'PRESENT' : 'ABSENT' })
      ).catch((erro) => {
        alterar(anterior);
        Alert.alert('Presença não registrada', erro.message);
      });
    },
    [enfileirar, setChamada]
  );

  /** Lança como ABSENT quem não está presente e depois POST /attendances/{id}/finish. */
  const finalizarChamada = useCallback(async () => {
    const atual = chamadaRef.current;
    if (!atual) return;
    await enfileirar(async () => {
      const ausencias = Object.fromEntries(
        Object.entries(atual.presencas)
          .filter(([, presente]) => !presente)
          .map(([alunoId]) => [alunoId, 'ABSENT'])
      );
      if (Object.keys(ausencias).length) await apiChamadas.registrarPresencas(atual.id, ausencias);
      await apiChamadas.finalizarChamada(atual.id);
    });
    setChamada(null);
  }, [enfileirar, setChamada]);

  /** POST /attendances/{id}/cancel */
  const cancelarChamada = useCallback(async () => {
    const atual = chamadaRef.current;
    if (!atual) return;
    await enfileirar(() => apiChamadas.cancelarChamada(atual.id));
    setChamada(null);
  }, [enfileirar, setChamada]);

  const value = useMemo(
    () => ({ chamada, iniciarChamada, marcarPresenca, finalizarChamada, cancelarChamada }),
    [chamada, iniciarChamada, marcarPresenca, finalizarChamada, cancelarChamada]
  );

  return <ChamadaContext.Provider value={value}>{children}</ChamadaContext.Provider>;
}

export function useChamada() {
  const context = useContext(ChamadaContext);
  if (!context) throw new Error('useChamada precisa estar dentro de <ChamadaProvider>');
  return context;
}
