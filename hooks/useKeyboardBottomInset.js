import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Retorna a altura atual do teclado para empurrar o conteúdo manualmente.
 * Mais confiável no Android com edge-to-edge do que só KeyboardAvoidingView.
 */
export function useKeyboardBottomInset() {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      setInset(event.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      setInset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  return inset;
}
