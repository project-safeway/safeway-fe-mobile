import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Card } from '../../../components/Card';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { Input } from '../../../components/Input';
import { FiltrosCard } from '../../../components/financeiro/FiltrosCard';
import { FiltroChip } from '../../../components/financeiro/FiltroChip';
import { StatusBadge } from '../../../components/financeiro/StatusBadge';
import {
  confirmarCancelamentoMensalidade,
  confirmarPagamentoMensalidade,
} from '../../../components/financeiro/confirmacoes';
import { colors } from '../../../constants/colors';
import { useFinanceiro } from '../../../contexts/FinanceiroContext';
import { useKeyboardBottomInset } from '../../../hooks/useKeyboardBottomInset';
import { brToISO, formatCurrency, isoToBR, maskDate } from '../../../utils/formatters';
import { STATUS_MENSALIDADE, dentroDoPeriodo, periodoAtalho } from '../../../utils/financeiro';

const ATALHOS = [
  { key: 'mes', label: 'Mês Atual' },
  { key: 'hoje', label: 'Hoje' },
  { key: 'ano', label: 'Ano Atual' },
];
const STATUS_FILTRO = ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'];

function filtrosDoAtalho(atalho) {
  const { dataInicio, dataFim } = periodoAtalho(atalho);
  return { dataInicio: isoToBR(dataInicio), dataFim: isoToBR(dataFim), atalho };
}

const filtrosIniciais = () => ({ texto: '', status: [], ...filtrosDoAtalho('mes') });

export default function MensalidadesScreen() {
  const { mensalidades, carregado, erro, recarregar, pagarMensalidade, cancelarMensalidade, nomeResponsavel } =
    useFinanceiro();
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );
  const keyboardInset = useKeyboardBottomInset();
  const [filtros, setFiltros] = useState(filtrosIniciais);

  const setFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const setData = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: maskDate(valor), atalho: '' }));
  const aplicarAtalho = (atalho) =>
    setFiltros((prev) => ({ ...prev, ...filtrosDoAtalho(prev.atalho === atalho && atalho !== 'mes' ? 'mes' : atalho) }));
  const toggleStatus = (status) =>
    setFiltros((prev) => ({
      ...prev,
      status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status],
    }));

  const filtradas = useMemo(() => {
    const periodo = { dataInicio: brToISO(filtros.dataInicio), dataFim: brToISO(filtros.dataFim) };
    const texto = filtros.texto.trim().toLowerCase();
    return mensalidades
      .filter((m) => dentroDoPeriodo(m.dataVencimento, periodo))
      .filter((m) => filtros.status.length === 0 || filtros.status.includes(m.status))
      .filter((m) => !texto || String(m.id).includes(texto) || (m.nomeAluno || '').toLowerCase().includes(texto))
      .sort((a, b) => b.dataVencimento.localeCompare(a.dataVencimento) || a.nomeAluno.localeCompare(b.nomeAluno));
  }, [mensalidades, filtros]);

  const filtrosAtivos =
    (filtros.texto ? 1 : 0) + (filtros.status.length ? 1 : 0) + (filtros.atalho !== 'mes' ? 1 : 0);
  const totalRecebido = filtradas
    .filter((m) => m.status === 'PAGO')
    .reduce((acc, m) => acc + (Number(m.valorMensalidade) || 0), 0);
  const totalAReceber = filtradas
    .filter((m) => m.status === 'PENDENTE' || m.status === 'ATRASADO')
    .reduce((acc, m) => acc + (Number(m.valorMensalidade) || 0), 0);

  const header = (
    <>
      <BackHeader title="Mensalidades" subtitle="Receitas por aluno" />

      <View style={styles.resumo}>
        <Card style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>Recebido</Text>
          <Text style={[styles.resumoValor, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalRecebido)}
          </Text>
        </Card>
        <Card style={styles.resumoCard}>
          <Text style={styles.resumoLabel}>A receber</Text>
          <Text style={[styles.resumoValor, { color: colors.warning }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totalAReceber)}
          </Text>
        </Card>
      </View>

      <FiltrosCard ativos={filtrosAtivos} onLimpar={() => setFiltros(filtrosIniciais())}>
        <Input
          label="Buscar por nome"
          placeholder="Digite o nome do aluno"
          value={filtros.texto}
          onChangeText={(v) => setFiltro('texto', v)}
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
        <Text style={styles.filtroLabel}>Status</Text>
        <View style={styles.chips}>
          {STATUS_FILTRO.map((s) => (
            <FiltroChip
              key={s}
              label={STATUS_MENSALIDADE[s].label}
              active={filtros.status.includes(s)}
              color={STATUS_MENSALIDADE[s].color}
              onPress={() => toggleStatus(s)}
            />
          ))}
        </View>
      </FiltrosCard>

      <Text style={styles.contagem}>
        {filtradas.length} {filtradas.length === 1 ? 'mensalidade' : 'mensalidades'}
      </Text>
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
            carregado ? (
              <Card style={styles.emptyCard}>
                <Ionicons name="cash-outline" size={40} color={colors.border} />
                <Text style={styles.emptyTitle}>Nenhuma mensalidade encontrada</Text>
                <Text style={styles.emptyText}>Tente ajustar os filtros.</Text>
              </Card>
            ) : (
              <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
            )
          }
          renderItem={({ item }) => {
            const emAberto = item.status !== 'PAGO' && item.status !== 'CANCELADO';
            const responsavel = nomeResponsavel(item.alunoId);
            return (
              <Card>
                <View style={styles.cardTop}>
                  <Text style={styles.nome} numberOfLines={1}>
                    {item.nomeAluno}
                  </Text>
                  <StatusBadge status={item.status} />
                </View>
                {responsavel ? <Text style={styles.meta}>Responsável: {responsavel}</Text> : null}
                <Text style={styles.meta}>
                  Vencimento: {isoToBR(item.dataVencimento)}
                  {item.dataPagamento ? ` • Pago em ${isoToBR(item.dataPagamento)}` : ''}
                </Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.valor}>{formatCurrency(item.valorMensalidade)}</Text>
                  {emAberto ? (
                    <View style={styles.acoes}>
                      <TouchableOpacity
                        style={styles.cancelarBtn}
                        onPress={() => confirmarCancelamentoMensalidade(item, cancelarMensalidade)}
                      >
                        <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                        <Text style={styles.cancelarText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.pagarBtn}
                        onPress={() => confirmarPagamentoMensalidade(item, pagarMensalidade)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                        <Text style={styles.pagarText}>Marcar Pago</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
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
  resumo: { flexDirection: 'row', gap: 8 },
  resumoCard: { flex: 1, paddingVertical: 12 },
  resumoLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  resumoValor: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  filtroLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  contagem: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nome: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { marginTop: 3, fontSize: 12, color: colors.textMuted },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  valor: { fontSize: 16, fontWeight: '700', color: colors.text },
  acoes: { flexDirection: 'row', gap: 8 },
  cancelarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.errorBg,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelarText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  pagarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pagarText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
