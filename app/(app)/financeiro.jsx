import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackHeader } from '../../components/BackHeader';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';
import { mockFinanceiro } from '../../data/mock';

export default function FinanceiroScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BackHeader
          title="Controle Financeiro"
          subtitle="Fluxo de caixa e mensalidades"
          showBack={false}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryRow}
        >
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Receita Total</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {formatCurrency(mockFinanceiro.receitaTotal)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Despesas Total</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(mockFinanceiro.despesasTotal)}
            </Text>
          </Card>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Saldo Mensal</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(mockFinanceiro.saldoMensal)}
            </Text>
          </Card>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mensalidades</Text>
        </View>

        {mockFinanceiro.mensalidades.map((item) => (
          <Card key={item.id} style={styles.listCard}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            </View>
            <View
              style={[
                styles.badge,
                item.status === 'pago' ? styles.badgePago : styles.badgePendente,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.status === 'pago' ? styles.badgeTextPago : styles.badgeTextPendente,
                ]}
              >
                {item.status === 'pago' ? 'Pago' : 'Pendente'}
              </Text>
            </View>
          </Card>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Despesas Recentes</Text>
        </View>

        {mockFinanceiro.despesas.map((item) => (
          <Card key={item.id} style={styles.listCard}>
            <View>
              <Text style={styles.itemName}>{item.description}</Text>
              <Text style={styles.itemDate}>{item.date}</Text>
            </View>
            <Text style={styles.despesaValue}>- {formatCurrency(item.amount)}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  summaryRow: { gap: 10, paddingBottom: 8 },
  summaryCard: { width: 150, marginBottom: 0 },
  summaryLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemAmount: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  itemDate: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgePago: { backgroundColor: colors.successBg },
  badgePendente: { backgroundColor: colors.errorBg },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextPago: { color: colors.success },
  badgeTextPendente: { color: colors.error },
  despesaValue: { fontSize: 14, fontWeight: '700', color: colors.error },
});
