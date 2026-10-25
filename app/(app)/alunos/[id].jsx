import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { colors } from '../../../constants/colors';
import { useCarregar } from '../../../hooks/useCarregar';
import { buscarAluno } from '../../../services/alunos';
import { formatCurrency, formatDate, formatEndereco, formatPhone } from '../../../utils/formatters';

function InfoItem({ label, value }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function AlunoDetalheScreen() {
  const { id } = useLocalSearchParams();
  const { dados: aluno, erro, recarregar } = useCarregar(() => buscarAluno(id), [id]);

  if (!aluno) {
    return (
      <KeyboardScreen>
        <BackHeader title="Aluno" subtitle="Visualização completa do cadastro" onBack={() => router.back()} />
        <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
      </KeyboardScreen>
    );
  }

  return (
    <KeyboardScreen>
      <BackHeader
        title={aluno.name}
        subtitle="Visualização completa do cadastro"
        onBack={() => router.back()}
      />

      <Button
        title="Editar Cadastro"
        variant="outline"
        onPress={() => Alert.alert('Em breve', 'A edição do aluno ainda não está disponível no app.')}
        style={styles.editBtn}
      />

      <Card>
        <Text style={styles.section}>Dados do Aluno</Text>
        <InfoItem label="Nome" value={aluno.name} />
        <InfoItem label="Nascimento" value={aluno.birthdate ? formatDate(aluno.birthdate) : null} />
        <InfoItem label="Série" value={aluno.grade} />
        <InfoItem label="Sala" value={aluno.classroom} />
        <InfoItem label="Professor" value={aluno.professor} />
      </Card>

      <Card>
        <Text style={styles.section}>Escola</Text>
        <InfoItem label="Nome" value={aluno.school?.name} />
        <InfoItem label="Endereço" value={formatEndereco(aluno.school?.address)} />
      </Card>

      <Card>
        <Text style={styles.section}>Financeiro</Text>
        <InfoItem label="Mensalidade" value={formatCurrency(aluno.monthlyFee)} />
        <InfoItem label="Dia de vencimento" value={aluno.dueDate} />
      </Card>

      {(aluno.guardians || []).map((responsavel) => (
        <Card key={responsavel.id}>
          <Text style={styles.section}>Responsável</Text>
          <InfoItem label="Nome" value={responsavel.name} />
          <InfoItem
            label="Telefone"
            value={responsavel.primaryPhoneNumber ? formatPhone(responsavel.primaryPhoneNumber) : null}
          />
          <InfoItem label="E-mail" value={responsavel.email} />
          <InfoItem label="Endereço" value={formatEndereco(responsavel.address)} />
        </Card>
      ))}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  editBtn: { marginBottom: 12, borderRadius: 12, minHeight: 46 },
  section: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoItem: { marginBottom: 10 },
  infoLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
});
