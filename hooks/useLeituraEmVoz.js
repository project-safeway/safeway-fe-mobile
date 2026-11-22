import { useCallback, useEffect, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';

// APK gerado antes do expo-speech não tem o módulo: a leitura fica indisponível, sem derrubar o app.
const Fala = requireOptionalNativeModule('ExpoSpeech') ? require('expo-speech') : null;

/** Lê as respostas do assistente em voz alta (pt-BR), com opção de silenciar. */
export function useLeituraEmVoz() {
  const [silenciado, setSilenciado] = useState(false);
  const [falando, setFalando] = useState(false);

  const parar = useCallback(() => {
    if (!Fala) return;
    Fala.stop().catch(() => {});
    setFalando(false);
  }, []);

  const falar = useCallback(
    (texto) => {
      const limpo = String(texto || '').replace(/[•*#_`]/g, '').trim();
      if (!Fala || silenciado || !limpo) return;
      Fala.stop().catch(() => {});
      Fala.speak(limpo, {
        language: 'pt-BR',
        rate: 1.05,
        onStart: () => setFalando(true),
        onDone: () => setFalando(false),
        onStopped: () => setFalando(false),
        onError: () => setFalando(false),
      });
    },
    [silenciado]
  );

  const alternarSilencio = useCallback(() => {
    setSilenciado((atual) => {
      if (!atual) Fala?.stop().catch(() => {});
      return !atual;
    });
    setFalando(false);
  }, []);

  useEffect(() => () => Fala?.stop().catch(() => {}), []);

  return { disponivel: Boolean(Fala), silenciado, falando, falar, parar, alternarSilencio };
}
