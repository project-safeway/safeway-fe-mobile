import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '../../../../components/BackHeader';
import { EscolaForm } from '../../../../components/EscolaForm';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { mockEscolasComAlunos } from '../../../../data/mock';

export default function EdicaoEscolaScreen() {
  const { id } = useLocalSearchParams();
  const escola =
    mockEscolasComAlunos.find((item) => String(item.escola.id) === String(id))?.escola ??
    mockEscolasComAlunos[0].escola;

  const salvar = async (payload) => {
    console.log(`[mock] PUT /escolas/${escola.id}`, payload);
    await new Promise((resolve) => setTimeout(resolve, 500));
    Alert.alert('Escola atualizada', 'Escola atualizada com sucesso!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Editar Escola" subtitle="Atualize as informações da instituição" />
      <EscolaForm
        initialValues={escola}
        submitLabel="Salvar Alterações"
        onSubmit={salvar}
        onCancel={() => router.back()}
      />
    </KeyboardScreen>
  );
}
