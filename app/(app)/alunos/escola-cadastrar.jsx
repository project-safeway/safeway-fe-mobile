import { Alert } from 'react-native';
import { router } from 'expo-router';
import { BackHeader } from '../../../components/BackHeader';
import { EscolaForm } from '../../../components/EscolaForm';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { criarEscola } from '../../../services/escolas';

export default function CadastroEscolaScreen() {
  const cadastrar = async (payload) => {
    try {
      await criarEscola(payload);
      Alert.alert('Escola cadastrada', 'Escola cadastrada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (erro) {
      Alert.alert('Não foi possível cadastrar', erro.message);
    }
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Escola" subtitle="Registro de unidades escolares" />
      <EscolaForm submitLabel="Cadastrar Escola" onSubmit={cadastrar} />
    </KeyboardScreen>
  );
}
