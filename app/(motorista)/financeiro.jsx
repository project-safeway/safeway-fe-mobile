import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatters';
import { mockFinanceiro } from '../../data/mock';

export default function FinanceiroScreen() {
  const maxBar = Math.max(
    ...mockFinanceiro.chartReceitaDespesas.flatMap((item) => [item.receita, item.despesa])
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Fluxo de Caixa" title="Controle Financeiro" />

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
          <Text style={styles.sectionTitle}>Mensalidades (Receitas)</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Ver Todas</Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() => Alert.alert('Em breve', 'Cadastro de despesa será integrado depois.')}
          >
            <Text style={styles.sectionLink}>Nova Despesa</Text>
          </TouchableOpacity>
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

        <Card style={styles.chartsCard}>
          <Text style={styles.chartTitle}>Receita vs Despesas</Text>
          <Text style={styles.chartSubtitle}>Últimos 6 meses (Jul–Dez)</Text>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Receita</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: colors.chartBrown }]} />
              <Text style={styles.legendText}>Despesas</Text>
            </View>
          </View>

          <View style={styles.barsRow}>
            {mockFinanceiro.chartReceitaDespesas.map((item) => (
              <View key={item.month} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, (item.receita / maxBar) * 90),
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(8, (item.despesa / maxBar) * 90),
                        backgroundColor: colors.chartBrown,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>

          <View style={styles.donutHeader}>
            <Text style={styles.chartTitle}>Composição de Despesas</Text>
            <Text style={styles.donutTotal}>
              Total: {formatCurrency(mockFinanceiro.despesasTotal)}
            </Text>
          </View>

          <View style={styles.donutRow}>
            <View style={styles.donut}>
              <View style={styles.donutInner}>
                <Text style={styles.donutInnerLabel}>Despesas</Text>
                <Text style={styles.donutInnerValue}>
                  {formatCurrency(mockFinanceiro.despesasTotal)}
                </Text>
              </View>
            </View>
            <View style={styles.donutLegend}>
              {mockFinanceiro.composicaoDespesas.map((item) => (
                <View key={item.label} style={styles.donutLegendItem}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>
                    {item.label}: {item.percent}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  summaryRow: {
    gap: 10,
    paddingBottom: 8,
  },
  summaryCard: {
    width: 150,
    marginBottom: 0,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemAmount: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },
  itemDate: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePago: {
    backgroundColor: colors.successBg,
  },
  badgePendente: {
    backgroundColor: colors.errorBg,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextPago: {
    color: colors.success,
  },
  badgeTextPendente: {
    color: colors.error,
  },
  despesaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  chartsCard: {
    marginTop: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  chartSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    height: 120,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 100,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
  },
  donutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  donutTotal: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donut: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 14,
    borderColor: colors.primary,
    borderTopColor: colors.chartBrown,
    borderRightColor: colors.primaryDark,
    borderBottomColor: colors.chartPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    alignItems: 'center',
  },
  donutInnerLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  donutInnerValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  donutLegend: {
    flex: 1,
    gap: 8,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
