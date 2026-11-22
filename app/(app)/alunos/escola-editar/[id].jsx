import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '../../../../components/BackHeader';
import { EscolaForm } from '../../../../components/EscolaForm';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../../components/EstadoCarregamento';
import { useCarregar } from '../../../../hooks/useCarregar';
import { atualizarEscola, buscarEscola } from '../../../../services/escolas';

export default function EdicaoEscolaScreen() {
  const { id } = useLocalSearchParams();
  const { dados: escola, erro, recarregar } = useCarregar(() => buscarEscola(id), [id]);

  const salvar = async (payload) => {
    try {
      await atualizarEscola(id, payload);
      Alert.alert('Escola atualizada', 'Escola atualizada com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Não foi possível salvar', e.message);
    }
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Editar Escola" subtitle="Atualize as informações da instituição" />
      {escola ? (
        <EscolaForm
          initialValues={escola}
          submitLabel="Salvar Alterações"
          onSubmit={salvar}
          onCancel={() => router.back()}
        />
      ) : (
        <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
      )}
    </KeyboardScreen>
  );
}
