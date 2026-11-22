import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Button } from '../../../components/Button';
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
import { brToISO, formatCurrency, isoToBR, maskDate, maskMoney } from '../../../utils/formatters';
import { STATUS_MENSALIDADE, dentroDoPeriodo, periodoAtalho } from '../../../utils/financeiro';
import { validarDesconto } from '../../../utils/mensalidadeForm';

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
  const {
    mensalidades,
    carregado,
    erro,
    recarregar,
    pagarMensalidade,
    cancelarMensalidade,
    aplicarDesconto,
    nomeResponsavel,
  } = useFinanceiro();
  useFocusEffect(
    useCallback(() => {
      recarregar();
    }, [recarregar])
  );
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardBottomInset();
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [descontoAlvo, setDescontoAlvo] = useState(null);
  const [valorDescontoTexto, setValorDescontoTexto] = useState('');
  const [erroDesconto, setErroDesconto] = useState(null);
  const [salvandoDesconto, setSalvandoDesconto] = useState(false);

  const abrirModalDesconto = (mensalidade) => {
    setDescontoAlvo(mensalidade);
    setValorDescontoTexto('');
    setErroDesconto(null);
  };

  const fecharModalDesconto = () => {
    if (salvandoDesconto) return;
    setDescontoAlvo(null);
    setValorDescontoTexto('');
    setErroDesconto(null);
  };

  const confirmarDesconto = async () => {
    if (!descontoAlvo) return;
    const { valorDesconto, erro: validacao } = validarDesconto(
      valorDescontoTexto,
      descontoAlvo.valorMensalidade
    );
    if (validacao) {
      setErroDesconto(validacao);
      return;
    }
    setErroDesconto(null);
    setSalvandoDesconto(true);
    const ok = await aplicarDesconto(descontoAlvo.id, valorDesconto);
    setSalvandoDesconto(false);
    if (ok) {
      setDescontoAlvo(null);
      setValorDescontoTexto('');
    }
  };

  const previewDesconto = descontoAlvo
    ? validarDesconto(valorDescontoTexto, descontoAlvo.valorMensalidade)
    : null;
  const novoValorPreview =
    descontoAlvo && previewDesconto && !previewDesconto.erro
      ? Number(descontoAlvo.valorMensalidade) - previewDesconto.valorDesconto
      : null;

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
      <BackHeader
        title="Mensalidades"
        subtitle="Receitas por aluno"
        right={
          <TouchableOpacity
            style={styles.novaBtn}
            onPress={() => router.push('/(app)/financeiro/mensalidade')}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.novaText}>Nova</Text>
          </TouchableOpacity>
        }
      />

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
                        style={styles.descontoBtn}
                        onPress={() => abrirModalDesconto(item)}
                        accessibilityLabel={`Aplicar desconto para ${item.nomeAluno}`}
                      >
                        <Ionicons name="pricetag-outline" size={15} color={colors.primaryDark} />
                        <Text style={styles.descontoText}>Desconto</Text>
                      </TouchableOpacity>
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
                        <Text style={styles.pagarText}>Pagar</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          }}
        />
      </KeyboardAvoidingView>

      <Modal
        visible={Boolean(descontoAlvo)}
        transparent
        animationType="fade"
        onRequestClose={fecharModalDesconto}
      >
        <Pressable style={styles.overlay} onPress={fecharModalDesconto}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable
              style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.sheetTitle}>Aplicar Desconto</Text>
              {descontoAlvo ? (
                <Text style={styles.sheetSubtitle}>
                  {descontoAlvo.nomeAluno} • Valor atual: {formatCurrency(descontoAlvo.valorMensalidade)}
                </Text>
              ) : null}

              <Input
                label="Valor do desconto (R$) *"
                placeholder="0,00"
                value={valorDescontoTexto}
                onChangeText={(v) => {
                  setValorDescontoTexto(maskMoney(v));
                  if (erroDesconto) setErroDesconto(null);
                }}
                keyboardType="number-pad"
                error={erroDesconto}
              />

              {novoValorPreview !== null ? (
                <Text style={styles.preview}>
                  Novo valor: <Text style={styles.previewBold}>{formatCurrency(novoValorPreview)}</Text>
                </Text>
              ) : null}

              <View style={styles.sheetActions}>
                <Button
                  title="Voltar"
                  variant="outline"
                  onPress={fecharModalDesconto}
                  disabled={salvandoDesconto}
                  style={styles.sheetBtn}
                />
                <Button
                  title="Aplicar"
                  onPress={confirmarDesconto}
                  loading={salvandoDesconto}
                  style={styles.sheetBtn}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  valor: { fontSize: 16, fontWeight: '700', color: colors.text },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  descontoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  descontoText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  cancelarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.errorBg,
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  cancelarText: { color: colors.error, fontSize: 12, fontWeight: '700' },
  pagarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pagarText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sheetSubtitle: { marginTop: 4, marginBottom: 14, fontSize: 13, color: colors.textSecondary },
  preview: { marginTop: -4, marginBottom: 14, fontSize: 13, color: colors.textSecondary },
  previewBold: { color: colors.success, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetBtn: { flex: 1, borderRadius: 14 },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
