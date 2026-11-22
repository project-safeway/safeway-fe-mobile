import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Busca os dados da tela sempre que ela ganha foco (ao voltar de um cadastro, a lista já vem atualizada).
 * @template T
 * @param {() => Promise<T>} buscar
 * @param {unknown[]} [deps] refaz a busca quando mudam (ex.: id da rota)
 */
export function useCarregar(buscar, deps = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  const executar = useCallback((ativo = () => true) => {
    setCarregando(true);
    setErro(null);
    return buscarRef
      .current()
      .then((resultado) => ativo() && setDados(resultado))
      .catch((e) => ativo() && setErro(e))
      .finally(() => ativo() && setCarregando(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      executar(() => ativo);
      return () => {
        ativo = false;
      };
    }, [executar, ...deps])
  );

  const recarregar = useCallback(() => executar(), [executar]);

  return { dados, setDados, carregando, erro, recarregar };
}
