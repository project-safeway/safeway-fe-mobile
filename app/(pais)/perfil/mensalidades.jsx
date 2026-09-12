import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockResponsavel, mockMensalidadePais } from '../../../data/mock';
import { formatCurrency } from '../../../utils/formatters';

export default function MensalidadesScreen() {
  const { resumo, historico } = mockMensalidadePais;
  const filho = mockResponsavel.filho;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={historico}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.topTitle}>Histórico de Mensalidades</Text>
              <View style={styles.backBtnPlaceholder} />
            </View>

            <Card>
              <View style={styles.childRow}>
                <View style={styles.childAvatar}>
                  <Ionicons name="person" size={20} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.childName}>{filho.nome}</Text>
                  <Text style={styles.childMeta}>
                    {filho.school} • {filho.grade.replace('Ensino Fundamental', 'Fundamental')}
                  </Text>
                </View>
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Total Pago</Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  {formatCurrency(resumo.totalPago)}
                </Text>
                <Text style={styles.summaryHint}>{resumo.parcelasPagas} parcelas quitadas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCol}>
                <Text style={styles.summaryLabel}>Total Pendente</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {formatCurrency(resumo.totalPendente)}
                </Text>
                <Text style={styles.summaryHint}>{resumo.parcelasAbertas} parcelas em aberto</Text>
              </View>
            </Card>

            <Text style={styles.section}>HISTÓRICO DE PARCELAS</Text>
          </>
        }
        renderItem={({ item }) => {
          const pago = item.status === 'pago';
          return (
            <Card style={styles.itemCard}>
              <View>
                <Text style={styles.mes}>{item.mes}</Text>
                <Text style={styles.venc}>Vencimento: {item.vencimento}</Text>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.valor}>{formatCurrency(item.valor)}</Text>
                <View style={[styles.badge, pago ? styles.badgePago : styles.badgeAguardando]}>
                  <Text style={[styles.badgeText, pago ? styles.textPago : styles.textAguardando]}>
                    {pago ? 'Pago' : 'Aguardando'}
                  </Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 40 },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childName: { fontSize: 16, fontWeight: '700', color: colors.text },
  childMeta: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  summaryCard: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1 },
  summaryDivider: { width: 1, height: 54, backgroundColor: colors.borderLight, marginHorizontal: 12 },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  summaryHint: { fontSize: 12, color: colors.textMuted },
  section: {
    fontSize: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mes: { fontSize: 15, fontWeight: '700', color: colors.text },
  venc: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  valor: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgePago: { backgroundColor: colors.successBg },
  badgeAguardando: { backgroundColor: colors.primarySoft },
  badgeText: { fontSize: 12, fontWeight: '700' },
  textPago: { color: colors.success },
  textAguardando: { color: colors.primary },
});
