import { useCallback, useEffect, useRef, useState } from 'react';
import { requireOptionalNativeModule } from 'expo';

// No Expo Go o módulo nativo não existe e importar a lib direto derrubaria o app.
const Reconhecimento = requireOptionalNativeModule('ExpoSpeechRecognition')
  ? require('expo-speech-recognition').ExpoSpeechRecognitionModule
  : null;

const MENSAGENS_ERRO = {
  'not-allowed': 'Permita o uso do microfone nas configurações do celular.',
  'service-not-allowed': 'Reconhecimento de voz indisponível. Ative o serviço de voz do Google no celular.',
  'language-not-supported': 'O reconhecimento de voz do celular não suporta português.',
  network: 'Sem conexão para transcrever o áudio.',
  'no-speech': 'Não ouvi nada. Tente falar de novo.',
  'speech-timeout': 'Não ouvi nada. Tente falar de novo.',
  busy: 'O microfone está ocupado. Tente de novo em instantes.',
};

/**
 * Fala → texto usando o reconhecimento de voz do próprio aparelho.
 * @param {Object} opcoes
 * @param {(texto: string) => void} opcoes.onTextoFinal chamado quando a fala termina com algum texto
 * @param {string[]} [opcoes.palavrasEsperadas] nomes que o reconhecedor deve priorizar
 */
export function useTranscricao({ onTextoFinal, palavrasEsperadas = [] }) {
  const [ouvindo, setOuvindo] = useState(false);
  const [textoParcial, setTextoParcial] = useState('');
  const [erro, setErro] = useState(null);
  const textoRef = useRef('');
  const onTextoFinalRef = useRef(onTextoFinal);
  onTextoFinalRef.current = onTextoFinal;

  useEffect(() => {
    if (!Reconhecimento) return undefined;

    const assinaturas = [
      Reconhecimento.addListener('start', () => {
        textoRef.current = '';
        setTextoParcial('');
        setErro(null);
        setOuvindo(true);
      }),
      Reconhecimento.addListener('result', (evento) => {
        const texto = evento.results?.[0]?.transcript ?? '';
        textoRef.current = texto;
        setTextoParcial(texto);
      }),
      Reconhecimento.addListener('error', (evento) => {
        if (evento.error === 'aborted') return;
        setErro(MENSAGENS_ERRO[evento.error] ?? 'Não consegui entender o áudio.');
        console.warn('[voz]', evento.error, evento.message);
      }),
      Reconhecimento.addListener('end', () => {
        setOuvindo(false);
        setTextoParcial('');
        const texto = textoRef.current.trim();
        textoRef.current = '';
        if (texto) onTextoFinalRef.current?.(texto);
      }),
    ];

    return () => {
      assinaturas.forEach((assinatura) => assinatura.remove());
      Reconhecimento.abort();
    };
  }, []);

  const iniciar = useCallback(async () => {
    if (!Reconhecimento) {
      setErro('O microfone só funciona no app instalado pelo development build, não no Expo Go.');
      return;
    }
    setErro(null);
    const permissao = await Reconhecimento.requestPermissionsAsync();
    if (!permissao.granted) {
      setErro(MENSAGENS_ERRO['not-allowed']);
      return;
    }
    Reconhecimento.start({
      lang: 'pt-BR',
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      contextualStrings: palavrasEsperadas,
    });
  }, [palavrasEsperadas]);

  const parar = useCallback(() => {
    Reconhecimento?.stop();
  }, []);

  return { disponivel: Boolean(Reconhecimento), ouvindo, textoParcial, erro, iniciar, parar };
}
