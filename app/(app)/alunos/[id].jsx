import { View, Text, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { colors } from '../../../constants/colors';
import { mockAlunosDetalhe } from '../../../data/mock';
import { formatCurrency, formatDate } from '../../../utils/formatters';

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
  const aluno = mockAlunosDetalhe[id] || mockAlunosDetalhe[1];
  const responsavel = aluno.responsaveis?.[0];

  return (
    <KeyboardScreen>
      <BackHeader
        title={aluno.nome}
        subtitle="Visualização completa do cadastro"
        onBack={() => router.back()}
      />

      <Button
        title="Editar Cadastro"
        variant="outline"
        onPress={() => Alert.alert('Em breve', 'Edição será integrada com o backend.')}
        style={styles.editBtn}
      />

      <Card>
        <Text style={styles.section}>Dados do Aluno</Text>
        <InfoItem label="Nome" value={aluno.nome} />
        <InfoItem
          label="Nascimento"
          value={aluno.dtNascimento ? formatDate(aluno.dtNascimento) : null}
        />
        <InfoItem label="Série" value={aluno.serie} />
        <InfoItem label="Sala" value={aluno.sala} />
        <InfoItem label="Professor" value={aluno.professor} />
      </Card>

      <Card>
        <Text style={styles.section}>Escola</Text>
        <InfoItem label="Nome" value={aluno.escola?.nome} />
        <InfoItem
          label="Endereço"
          value={
            aluno.escola?.endereco
              ? `${aluno.escola.endereco.logradouro}, ${aluno.escola.endereco.numero} - ${aluno.escola.endereco.bairro}`
              : null
          }
        />
      </Card>

      <Card>
        <Text style={styles.section}>Financeiro</Text>
        <InfoItem
          label="Mensalidade"
          value={formatCurrency(aluno.valorPadraoMensalidade)}
        />
        <InfoItem label="Dia de vencimento" value={aluno.diaVencimento} />
      </Card>

      {responsavel ? (
        <Card>
          <Text style={styles.section}>Responsável</Text>
          <InfoItem label="Nome" value={responsavel.nome} />
          <InfoItem label="Telefone" value={responsavel.tel1} />
          <InfoItem label="E-mail" value={responsavel.email} />
          <InfoItem
            label="Endereço"
            value={
              responsavel.endereco
                ? `${responsavel.endereco.logradouro}, ${responsavel.endereco.numero}`
                : null
            }
          />
        </Card>
      ) : null}
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
