import { Alert } from 'react-native';
import { router } from 'expo-router';
import { BackHeader } from '../../../components/BackHeader';
import { AlunoForm } from '../../../components/AlunoForm';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { useCarregar } from '../../../hooks/useCarregar';
import { listarEscolas } from '../../../services/escolas';
import { criarAluno } from '../../../services/alunos';

export default function CadastroAlunoScreen() {
  const { dados: escolas, erro: erroEscolas, recarregar } = useCarregar(listarEscolas);

  const cadastrar = async ({ payload }) => {
    try {
      await criarAluno(payload);
      Alert.alert('Aluno cadastrado', 'Aluno cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (erro) {
      Alert.alert('Não foi possível cadastrar', erro.message);
    }
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Aluno" subtitle="Registro de novos estudantes" />
      <AlunoForm
        escolas={escolas}
        erroEscolas={erroEscolas}
        onRecarregarEscolas={recarregar}
        submitLabel="Cadastrar Aluno"
        onSubmit={cadastrar}
      />
    </KeyboardScreen>
  );
}
