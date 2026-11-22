import { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { colors } from '../../../constants/colors';
import { useCarregar } from '../../../hooks/useCarregar';
import {
  buscarAluno,
  definirResponsavelPrincipal,
  desvincularResponsavel,
} from '../../../services/alunos';
import { formatCurrency, formatDate, formatEndereco, formatPhone } from '../../../utils/formatters';
import { montarPayloadsDefinirPrincipal, responsavelPrincipal } from '../../../utils/alunoForm';

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
  const [alterandoPrincipalId, setAlterandoPrincipalId] = useState(null);

  if (!aluno) {
    return (
      <KeyboardScreen>
        <BackHeader title="Aluno" subtitle="Visualização completa do cadastro" onBack={() => router.back()} />
        <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
      </KeyboardScreen>
    );
  }

  const responsaveis = aluno.guardians || [];
  const principalAtual = responsavelPrincipal(responsaveis);

  const marcarComoPrincipal = async (responsavel) => {
    const atualizacoes = montarPayloadsDefinirPrincipal(responsaveis, responsavel.id);
    if (!atualizacoes.length) return;
    setAlterandoPrincipalId(responsavel.id);
    try {
      await definirResponsavelPrincipal(atualizacoes);
      recarregar();
    } catch (e) {
      Alert.alert('Não foi possível definir como principal', e.message);
    } finally {
      setAlterandoPrincipalId(null);
    }
  };

  const confirmarDesvinculo = (responsavel) => {
    Alert.alert(
      'Desvincular responsável',
      `Remover o vínculo de "${responsavel.name}" com ${aluno.name}? O cadastro do responsável continuará salvo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await desvincularResponsavel(aluno.id, responsavel.id);
              recarregar();
            } catch (e) {
              Alert.alert('Não foi possível desvincular', e.message);
            }
          },
        },
      ]
    );
  };

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
        onPress={() => router.push(`/(app)/alunos/editar/${aluno.id}`)}
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

      <View style={styles.respHeader}>
        <Text style={styles.respTitle}>Responsáveis ({responsaveis.length})</Text>
        <TouchableOpacity
          style={styles.addRespBtn}
          onPress={() => router.push(`/(app)/alunos/responsavel-adicionar/${aluno.id}`)}
        >
          <Ionicons name="add" size={16} color={colors.primaryDark} />
          <Text style={styles.addRespText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {responsaveis.length === 0 ? (
        <Card>
          <Text style={styles.emptyResp}>Nenhum responsável vinculado a este aluno.</Text>
        </Card>
      ) : (
        responsaveis.map((responsavel, index) => {
          const ehPrincipal = principalAtual?.id === responsavel.id;
          return (
            <Card key={responsavel.id}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.sectionNoBorder}>
                    {responsaveis.length > 1 ? `Responsável ${index + 1}` : 'Responsável'}
                  </Text>
                  {ehPrincipal ? (
                    <View style={styles.principalBadge}>
                      <Ionicons name="star" size={11} color={colors.success} />
                      <Text style={styles.principalBadgeText}>Principal</Text>
                    </View>
                  ) : null}
                </View>
                {responsaveis.length > 1 ? (
                  <TouchableOpacity
                    style={styles.unlinkBtn}
                    onPress={() => confirmarDesvinculo(responsavel)}
                    hitSlop={8}
                  >
                    <Ionicons name="unlink-outline" size={14} color={colors.error} />
                    <Text style={styles.unlinkText}>Desvincular</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <InfoItem label="Nome" value={responsavel.name} />
              <InfoItem
                label="Telefone"
                value={responsavel.primaryPhoneNumber ? formatPhone(responsavel.primaryPhoneNumber) : null}
              />
              {responsavel.secondaryPhoneNumber ? (
                <InfoItem
                  label="Telefone secundário"
                  value={formatPhone(responsavel.secondaryPhoneNumber)}
                />
              ) : null}
              <InfoItem label="E-mail" value={responsavel.email} />
              <InfoItem label="Endereço" value={formatEndereco(responsavel.address)} />
              {responsaveis.length > 1 && !ehPrincipal && responsavel.address ? (
                <TouchableOpacity
                  style={styles.setPrincipalBtn}
                  onPress={() => marcarComoPrincipal(responsavel)}
                  disabled={Boolean(alterandoPrincipalId)}
                >
                  <Ionicons name="star-outline" size={15} color={colors.primaryDark} />
                  <Text style={styles.setPrincipalText}>
                    {alterandoPrincipalId === responsavel.id
                      ? 'Salvando endereço principal…'
                      : 'Definir este endereço como principal'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </Card>
          );
        })
      )}
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
  respHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  respTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addRespBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addRespText: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionNoBorder: { fontSize: 15, fontWeight: '700', color: colors.text },
  principalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  principalBadgeText: { fontSize: 11, fontWeight: '700', color: colors.success },
  setPrincipalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  setPrincipalText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  unlinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  unlinkText: { fontSize: 12, fontWeight: '700', color: colors.error },
  emptyResp: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 4 },
  infoItem: { marginBottom: 10 },
  infoLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
});
