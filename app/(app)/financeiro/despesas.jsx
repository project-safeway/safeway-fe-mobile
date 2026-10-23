import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { FiltrosCard } from '../../../components/financeiro/FiltrosCard';
import { FiltroChip } from '../../../components/financeiro/FiltroChip';
import { confirmarExclusaoPagamento } from '../../../components/financeiro/confirmacoes';
import { colors } from '../../../constants/colors';
import { useFinanceiro } from '../../../contexts/FinanceiroContext';
import { useKeyboardBottomInset } from '../../../hooks/useKeyboardBottomInset';
import { brToISO, formatCurrency, isoToBR, maskDate } from '../../../utils/formatters';
import { categoriaDaDespesa, dentroDoPeriodo, periodoAtalho } from '../../../utils/financeiro';

const ATALHOS = [
  { key: 'mes', label: 'Mês Atual' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'ano', label: 'Ano Atual' },
];
const ORDENAR_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'dataPagamento', label: 'Data' },
  { value: 'valorPagamento', label: 'Valor' },
];

function filtrosDoAtalho(atalho) {
  const { dataInicio, dataFim } = periodoAtalho(atalho);
  return { dataInicio: isoToBR(dataInicio), dataFim: isoToBR(dataFim), atalho };
}

const filtrosIniciais = () => ({ descricao: '', ...filtrosDoAtalho('mes') });
const ORDENACAO_INICIAL = { campo: 'id', direcao: 'desc' };

function comparar(a, b, campo) {
  if (campo === 'dataPagamento') return a.dataPagamento.localeCompare(b.dataPagamento);
  return Number(a[campo]) - Number(b[campo]);
}

export default function DespesasScreen() {
  const { pagamentos, excluirPagamento } = useFinanceiro();
  const keyboardInset = useKeyboardBottomInset();
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [ordenacao, setOrdenacao] = useState(ORDENACAO_INICIAL);

  const setData = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: maskDate(valor), atalho: '' }));
  const aplicarAtalho = (atalho) =>
    setFiltros((prev) => ({ ...prev, ...filtrosDoAtalho(prev.atalho === atalho && atalho !== 'mes' ? 'mes' : atalho) }));

  const filtradas = useMemo(() => {
    const periodo = { dataInicio: brToISO(filtros.dataInicio), dataFim: brToISO(filtros.dataFim) };
    const descricao = filtros.descricao.trim().toLowerCase();
    const sinal = ordenacao.direcao === 'asc' ? 1 : -1;
    return pagamentos
      .filter((p) => dentroDoPeriodo(p.dataPagamento, periodo))
      .filter((p) => !descricao || (p.descricao || '').toLowerCase().includes(descricao))
      .sort((a, b) => sinal * comparar(a, b, ordenacao.campo));
  }, [pagamentos, filtros, ordenacao]);

  const filtrosAtivos =
    (filtros.descricao ? 1 : 0) +
    (filtros.atalho !== 'mes' ? 1 : 0) +
    (ordenacao.campo !== ORDENACAO_INICIAL.campo || ordenacao.direcao !== ORDENACAO_INICIAL.direcao ? 1 : 0);
  const total = filtradas.reduce((acc, p) => acc + (Number(p.valorPagamento) || 0), 0);

  const limpar = () => {
    setFiltros(filtrosIniciais());
    setOrdenacao(ORDENACAO_INICIAL);
  };

  const abrirFormulario = (id) =>
    router.push(id ? { pathname: '/(app)/financeiro/despesa', params: { id } } : '/(app)/financeiro/despesa');

  const header = (
    <>
      <BackHeader
        title="Despesas"
        subtitle="Pagamentos do transporte"
        right={
          <TouchableOpacity style={styles.novaBtn} onPress={() => abrirFormulario()}>
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.novaText}>Nova Despesa</Text>
          </TouchableOpacity>
        }
      />

      <Card style={styles.totalCard}>
        <View>
          <Text style={styles.totalLabel}>Total no período</Text>
          <Text style={styles.totalValor}>{formatCurrency(total)}</Text>
        </View>
        <Text style={styles.contagem}>
          {filtradas.length} {filtradas.length === 1 ? 'lançamento' : 'lançamentos'}
        </Text>
      </Card>

      <FiltrosCard ativos={filtrosAtivos} onLimpar={limpar}>
        <Input
          label="Descrição"
          placeholder="Ex: Funcionário, Gasolina..."
          value={filtros.descricao}
          onChangeText={(v) => setFiltros((prev) => ({ ...prev, descricao: v }))}
          leftIcon="search-outline"
        />
        <View style={styles.row}>
          <View style={styles.col}>
            <Input
              label="Data Início"
              placeholder="DD/MM/AAAA"
              value={filtros.dataInicio}
              onChangeText={(v) => setData('dataInicio', v)}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.col}>
            <Input
              label="Data Fim"
              placeholder="DD/MM/AAAA"
              value={filtros.dataFim}
              onChangeText={(v) => setData('dataFim', v)}
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Text style={styles.filtroLabel}>Atalhos</Text>
        <View style={styles.chips}>
          {ATALHOS.map((a) => (
            <FiltroChip key={a.key} label={a.label} active={filtros.atalho === a.key} onPress={() => aplicarAtalho(a.key)} />
          ))}
        </View>
        <View style={styles.row}>
          <View style={styles.col}>
            <Select
              label="Ordenar por"
              value={ordenacao.campo}
              options={ORDENAR_OPTIONS}
              onChange={(campo) => setOrdenacao((prev) => ({ ...prev, campo }))}
              compact
            />
          </View>
          <TouchableOpacity
            style={styles.direcaoBtn}
            onPress={() =>
              setOrdenacao((prev) => ({ ...prev, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' }))
            }
          >
            <Ionicons
              name={ordenacao.direcao === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={colors.text}
            />
            <Text style={styles.direcaoText}>{ordenacao.direcao === 'asc' ? 'Crescente' : 'Decrescente'}</Text>
          </TouchableOpacity>
        </View>
      </FiltrosCard>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          data={filtradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 28 + (Platform.OS === 'android' ? keyboardInset : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={40} color={colors.border} />
              <Text style={styles.emptyTitle}>Nenhuma despesa encontrada</Text>
              <Text style={styles.emptyText}>Ajuste os filtros ou registre uma nova despesa.</Text>
            </Card>
          }
          renderItem={({ item }) => {
            const categoria = categoriaDaDespesa(item.descricao);
            return (
              <Card>
                <View style={styles.cardTop}>
                  <Text style={styles.descricao} numberOfLines={2}>
                    {item.descricao}
                  </Text>
                  <Text style={styles.valor}>- {formatCurrency(item.valorPagamento)}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <View style={styles.metaRow}>
                    <View style={[styles.categoriaDot, { backgroundColor: categoria.color }]} />
                    <Text style={styles.meta}>
                      {categoria.label} • Pago em {isoToBR(item.dataPagamento)}
                    </Text>
                  </View>
                  <View style={styles.acoes}>
                    <TouchableOpacity
                      style={styles.acaoBtn}
                      onPress={() => abrirFormulario(item.id)}
                      accessibilityLabel={`Editar ${item.descricao}`}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acaoBtn}
                      onPress={() => confirmarExclusaoPagamento(item, excluirPagamento)}
                      accessibilityLabel={`Excluir ${item.descricao}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  novaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  novaText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  totalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 12, color: colors.textSecondary },
  totalValor: { marginTop: 2, fontSize: 20, fontWeight: '700', color: colors.error },
  contagem: { fontSize: 12, color: colors.textMuted },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  filtroLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  direcaoBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  direcaoText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  descricao: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  valor: { fontSize: 15, fontWeight: '700', color: colors.error },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  metaRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoriaDot: { width: 8, height: 8, borderRadius: 4 },
  meta: { flex: 1, fontSize: 12, color: colors.textMuted },
  acoes: { flexDirection: 'row', gap: 6 },
  acaoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
