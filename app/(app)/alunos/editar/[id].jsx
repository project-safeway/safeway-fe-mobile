import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '../../../../components/BackHeader';
import { AlunoForm } from '../../../../components/AlunoForm';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../../components/EstadoCarregamento';
import { useCarregar } from '../../../../hooks/useCarregar';
import { atualizarAlunoCompleto, buscarAluno } from '../../../../services/alunos';
import { listarEscolas } from '../../../../services/escolas';

async function carregarDadosEdicao(id) {
  const [aluno, escolas] = await Promise.all([buscarAluno(id), listarEscolas()]);
  return { aluno, escolas };
}

export default function EdicaoAlunoScreen() {
  const { id } = useLocalSearchParams();
  const { dados, erro, recarregar } = useCarregar(() => carregarDadosEdicao(id), [id]);

  const salvar = async ({ payload, alteracoesResponsaveis }) => {
    try {
      await atualizarAlunoCompleto(id, payload, alteracoesResponsaveis);
      Alert.alert('Aluno atualizado', 'Dados do aluno atualizados com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(
        e.parcial
          ? 'Responsável salvo, mas houve erro ao salvar o aluno'
          : 'Não foi possível salvar',
        e.message
      );
    }
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Editar Aluno" subtitle="Atualize as informações do estudante" />
      {dados ? (
        <AlunoForm
          initialValues={dados.aluno}
          escolas={dados.escolas}
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
