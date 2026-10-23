import { Alert } from 'react-native';
import { router } from 'expo-router';
import { BackHeader } from '../../../components/BackHeader';
import { EscolaForm } from '../../../components/EscolaForm';
import { KeyboardScreen } from '../../../components/KeyboardScreen';

export default function CadastroEscolaScreen() {
  const cadastrar = async (payload) => {
    console.log('[mock] POST /escolas', payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
    Alert.alert('Escola cadastrada', 'Cadastro mockado com sucesso!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Escola" subtitle="Registro de unidades escolares" />
      <EscolaForm submitLabel="Cadastrar Escola" onSubmit={cadastrar} />
    </KeyboardScreen>
  );
}
