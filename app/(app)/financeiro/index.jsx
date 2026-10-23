import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Card } from '../../../components/Card';
import { BarChart } from '../../../components/charts/BarChart';
import { DonutChart } from '../../../components/charts/DonutChart';
import { StatusBadge } from '../../../components/financeiro/StatusBadge';
import { acoesMensalidade } from '../../../components/financeiro/confirmacoes';
import { colors } from '../../../constants/colors';
import { useFinanceiro } from '../../../contexts/FinanceiroContext';
import { formatCurrency, isoToBR } from '../../../utils/formatters';
import {
  composicaoDespesas,
  dentroDoPeriodo,
  mesPorExtenso,
  periodoAtalho,
  resumoDoPeriodo,
  serieMensal,
  tituloMensalidade,
} from '../../../utils/financeiro';

const PRIORIDADE_STATUS = { ATRASADO: 0, PENDENTE: 1, PAGO: 2 };
const ITENS_RESUMO = 3;

const formatarInteiro = (valor) =>
  `R$ ${Math.round(valor).toLocaleString('pt-BR')}`;

export default function FinanceiroScreen() {
  const { mensalidades, pagamentos, pagarMensalidade, cancelarMensalidade, nomeResponsavel } = useFinanceiro();
  const [mesSelecionado, setMesSelecionado] = useState(null);
  const periodo = useMemo(() => periodoAtalho('mes'), []);

  const resumo = useMemo(
    () => resumoDoPeriodo(mensalidades, pagamentos, periodo),
    [mensalidades, pagamentos, periodo]
  );
  const serie = useMemo(() => serieMensal(mensalidades, pagamentos, 6), [mensalidades, pagamentos]);
  const composicao = useMemo(
    () => composicaoDespesas(pagamentos.filter((p) => dentroDoPeriodo(p.dataPagamento, periodo))),
    [pagamentos, periodo]
  );

  const mensalidadesMes = useMemo(
    () =>
      mensalidades
        .filter((m) => m.status !== 'CANCELADO' && dentroDoPeriodo(m.dataVencimento, periodo))
        .sort(
          (a, b) =>
            PRIORIDADE_STATUS[a.status] - PRIORIDADE_STATUS[b.status] ||
            a.dataVencimento.localeCompare(b.dataVencimento)
        )
        .slice(0, ITENS_RESUMO),
    [mensalidades, periodo]
  );

  const despesasRecentes = useMemo(
    () =>
      [...pagamentos]
        .sort((a, b) => b.dataPagamento.localeCompare(a.dataPagamento) || b.id - a.id)
        .slice(0, ITENS_RESUMO),
    [pagamentos]
  );

  const mesDetalhe = serie.find((s) => s.key === mesSelecionado);
  const saldoPositivo = resumo.saldo >= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Fluxo de Caixa"
          title="Controle Financeiro"
          right={<Text style={styles.mes}>{mesPorExtenso()}</Text>}
        />

        <View style={styles.kpis}>
          <Card style={styles.kpi}>
            <Text style={styles.kpiLabel}>RECEITA TOTAL</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(resumo.receita)}
            </Text>
            <Text style={styles.kpiHint} numberOfLines={1}>
              {resumo.mensalidadesRecebidas} recebidas
            </Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={styles.kpiLabel}>DESPESAS TOTAL</Text>
            <Text style={[styles.kpiValue, { color: colors.error }]} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(resumo.despesas)}
            </Text>
            <Text style={styles.kpiHint} numberOfLines={1}>
              no mês
            </Text>
          </Card>
          <Card style={styles.kpi}>
            <Text style={styles.kpiLabel}>SALDO MENSAL</Text>
            <Text
              style={[styles.kpiValue, { color: saldoPositivo ? colors.successAlt : colors.error }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(resumo.saldo)}
            </Text>
            <Text style={styles.kpiHint} numberOfLines={1}>
              {saldoPositivo ? 'Positivo' : 'Negativo'}
            </Text>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.flex}>
              <Text style={styles.chartTitle}>Receita vs Despesas</Text>
              <Text style={styles.chartSubtitle}>
                Últimos 6 meses ({serie[0].label}–{serie[serie.length - 1].label})
              </Text>
            </View>
            <View style={styles.legendaInline}>
              <View style={[styles.legendaDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendaText}>Receita</Text>
              <View style={[styles.legendaDot, { backgroundColor: colors.chartBrown }]} />
              <Text style={styles.legendaText}>Despesas</Text>
            </View>
          </View>
          <BarChart
            data={serie}
            selectedKey={mesSelecionado}
            onSelect={(key) => setMesSelecionado((atual) => (atual === key ? null : key))}
          />
          <Text style={styles.chartDetalhe}>
            {mesDetalhe
              ? `${mesDetalhe.label}: receita ${formatCurrency(mesDetalhe.receita)} • despesas ${formatCurrency(mesDetalhe.despesas)}`
              : 'Toque em um mês para ver os valores'}
          </Text>
        </Card>

        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, styles.flex]}>Composição de Despesas</Text>
            <Text style={styles.total}>Total: {formatCurrency(composicao.total)}</Text>
          </View>
          {composicao.total === 0 ? (
            <Text style={styles.empty}>Nenhuma despesa registrada neste mês.</Text>
          ) : (
            <View style={styles.donutRow}>
              <DonutChart fatias={composicao.fatias} titulo="Despesas" valor={formatarInteiro(composicao.total)} />
              <View style={styles.donutLegenda}>
                {composicao.fatias.map((f) => (
                  <View key={f.key} style={styles.donutLegendaItem}>
                    <View style={[styles.legendaQuadrado, { backgroundColor: f.color }]} />
                    <Text style={styles.donutLegendaLabel}>{f.label}</Text>
                    <Text style={styles.donutLegendaValor}>{f.percentualInteiro}%</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mensalidades (Receitas)</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/financeiro/mensalidades')} hitSlop={8}>
            <Text style={styles.link}>Ver Todas</Text>
          </TouchableOpacity>
        </View>
        {mensalidadesMes.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhuma mensalidade com vencimento neste mês.</Text>
          </Card>
        ) : (
          mensalidadesMes.map((m) => {
            const pendente = m.status !== 'PAGO';
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={pendente ? 0.7 : 1}
                disabled={!pendente}
                onPress={() => acoesMensalidade(m, pagarMensalidade, cancelarMensalidade)}
                accessibilityHint={pendente ? 'Toque para marcar como paga ou cancelar' : undefined}
              >
                <Card style={styles.row}>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {tituloMensalidade(m, nomeResponsavel(m.alunoId))}
                    </Text>
                    <Text style={styles.rowMeta}>{formatCurrency(m.valorMensalidade)}</Text>
                  </View>
                  <StatusBadge status={m.status} />
                </Card>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Despesas Recentes</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/financeiro/despesa')} hitSlop={8}>
            <Text style={styles.link}>Nova Despesa</Text>
          </TouchableOpacity>
        </View>
        {despesasRecentes.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhuma despesa registrada.</Text>
          </Card>
        ) : (
          despesasRecentes.map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/(app)/financeiro/despesa', params: { id: p.id } })}
            >
              <Card style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {p.descricao}
                  </Text>
                  <Text style={styles.rowDate}>Pago em {isoToBR(p.dataPagamento).slice(0, 5)}</Text>
                </View>
                <Text style={styles.despesaValor}>- {formatCurrency(p.valorPagamento)}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.verTodas} onPress={() => router.push('/(app)/financeiro/despesas')}>
          <Text style={styles.link}>Ver todas as despesas</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 28 },
  flex: { flex: 1 },
  mes: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  kpis: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, paddingHorizontal: 10, paddingVertical: 12 },
  kpiLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  kpiValue: { fontSize: 16, fontWeight: '700' },
  kpiHint: { marginTop: 2, fontSize: 10, color: colors.textMuted },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  link: { fontSize: 13, fontWeight: '600', color: colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowMeta: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
  rowDate: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  despesaValor: { fontSize: 15, fontWeight: '700', color: colors.error },
  verTodas: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 2, marginBottom: 16 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 13, paddingVertical: 6 },
  chartCard: { paddingVertical: 18 },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  chartTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  chartSubtitle: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  legendaInline: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 },
  legendaDot: { width: 10, height: 10, borderRadius: 2, marginLeft: 4 },
  legendaText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  chartDetalhe: { marginTop: 10, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  total: { fontSize: 13, fontWeight: '700', color: colors.primary, paddingTop: 3 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  donutLegenda: { flex: 1, gap: 10 },
  donutLegendaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendaQuadrado: { width: 12, height: 12, borderRadius: 3 },
  donutLegendaLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  donutLegendaValor: { fontSize: 13, fontWeight: '700', color: colors.text },
});
