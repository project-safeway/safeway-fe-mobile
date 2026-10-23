import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ChamadaContext = createContext(null);

/** Chamada da rota em andamento: compartilhada entre a tela da rota e o assistente. */
export function ChamadaProvider({ children }) {
  const [chamada, setChamada] = useState(null);

  const iniciarChamada = useCallback((itinerario) => {
    setChamada((atual) =>
      atual?.itinerarioId === itinerario.id
        ? atual
        : {
            itinerarioId: itinerario.id,
            nomeItinerario: itinerario.nome,
            alunos: (itinerario.alunos || []).map((a) => ({ id: a.alunoId, nome: a.nomeAluno })),
            presencas: Object.fromEntries((itinerario.alunos || []).map((a) => [a.alunoId, false])),
          }
    );
  }, []);

  const marcarPresenca = useCallback((alunoId, presente) => {
    setChamada((atual) =>
      atual && alunoId in atual.presencas
        ? { ...atual, presencas: { ...atual.presencas, [alunoId]: presente } }
        : atual
    );
  }, []);

  const encerrarChamada = useCallback(() => setChamada(null), []);

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
