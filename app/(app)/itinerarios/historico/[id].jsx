import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { Input } from '../../../../components/Input';
import { Select } from '../../../../components/Select';
import { colors } from '../../../../constants/colors';
import { mockHistoricoChamadas, mockItinerarios } from '../../../../data/mock';
import { maskDate } from '../../../../utils/formatters';
import { STATUS_CHAMADA_LABELS } from '../../../../utils/constants';
import { useKeyboardBottomInset } from '../../../../hooks/useKeyboardBottomInset';

const FILTROS_INICIAIS = {
  dataInicio: '',
  dataFim: '',
  statusChamada: '',
  escola: '',
  ordem: 'az',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const ORDEM_OPTIONS = [
  { value: 'az', label: 'Alunos A–Z' },
  { value: 'za', label: 'Alunos Z–A' },
];

function parseDataBR(valor, fimDoDia = false) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
  if (!match) return null;
  const [, d, m, a] = match;
  const data = new Date(Number(a), Number(m) - 1, Number(d));
  if (fimDoDia) data.setHours(23, 59, 59, 999);
  return isNaN(data.getTime()) ? null : data;
}

function processarHistorico(chamadas, alunosItinerario) {
  return chamadas.flatMap((chamada) =>
    (chamada.alunos || []).map((ca) => {
      const aluno = ca.aluno || {};
      const dataCompleta = new Date(ca.dataHora);
      const doItinerario = alunosItinerario.find((a) => a.nomeAluno === aluno.nome);
      return {
        id: `${chamada.id}-${aluno.nome}`,
        nomeAluno: aluno.nome || 'Sem nome',
        escola: aluno.escola?.nome || 'Não informado',
        responsavel: doItinerario?.nomeResponsavel || 'Não informado',
        sala: aluno.sala || '',
        data: dataCompleta.toLocaleDateString('pt-BR'),
        horarioRegistro: dataCompleta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        presente: ca.presenca === 'PRESENTE',
        statusChamada: chamada.status,
        dataCompleta,
      };
    })
  );
}

export default function HistoricoScreen() {
  const { id } = useLocalSearchParams();
  const keyboardInset = useKeyboardBottomInset();
  const itinerario = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const historico = useMemo(
    () => processarHistorico(mockHistoricoChamadas[itinerario.id] || [], itinerario.alunos || []),
    [itinerario]
  );

  const escolaOptions = useMemo(
    () => [
      { value: '', label: 'Todas' },
      ...[...new Set(historico.map((d) => d.escola))].map((e) => ({ value: e, label: e })),
    ],
    [historico]
  );

  const filtrados = useMemo(() => {
    let lista = [...historico];
    if (filtros.statusChamada) lista = lista.filter((d) => d.statusChamada === filtros.statusChamada);
    if (filtros.escola) lista = lista.filter((d) => d.escola === filtros.escola);
    const inicio = parseDataBR(filtros.dataInicio);
    if (inicio) lista = lista.filter((d) => d.dataCompleta >= inicio);
    const fim = parseDataBR(filtros.dataFim, true);
    if (fim) lista = lista.filter((d) => d.dataCompleta <= fim);
    lista.sort((a, b) =>
      filtros.ordem === 'za' ? b.nomeAluno.localeCompare(a.nomeAluno) : a.nomeAluno.localeCompare(b.nomeAluno)
    );
    return lista;
  }, [historico, filtros]);

  const setFiltro = (campo, valor) => setFiltros((prev) => ({ ...prev, [campo]: valor }));
  const filtrosAtivos = ['dataInicio', 'dataFim', 'statusChamada', 'escola'].filter((k) => filtros[k]).length;
  const totalPresentes = filtrados.filter((d) => d.presente).length;

  const header = (
    <>
      <BackHeader title="Histórico" subtitle="Visualize o histórico de presença por itinerário" />
      <Text style={styles.itinerarioInfo}>
        {itinerario.nome} • {itinerario.tipoViagem === 'SO_IDA' ? 'Ida' : 'Volta'}
      </Text>

      <View style={styles.stats}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total de Registros</Text>
          <Text style={styles.statValue}>{filtrados.length}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Presenças</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{totalPresentes}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Ausências</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {filtrados.length - totalPresentes}
          </Text>
        </Card>
      </View>

      <Card>
        <TouchableOpacity style={styles.filtrosHead} onPress={() => setFiltrosAbertos((v) => !v)}>
          <Ionicons name="options-outline" size={18} color={colors.text} />
          <Text style={styles.filtrosTitle}>Filtros</Text>
          {filtrosAtivos > 0 ? (
            <View style={styles.filtrosBadge}>
              <Text style={styles.filtrosBadgeText}>{filtrosAtivos}</Text>
            </View>
          ) : null}
          <View style={styles.flex} />
          <Ionicons name={filtrosAbertos ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {filtrosAbertos ? (
          <View style={styles.filtrosBody}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Data Início"
                  placeholder="DD/MM/AAAA"
                  value={filtros.dataInicio}
                  onChangeText={(v) => setFiltro('dataInicio', maskDate(v))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Data Fim"
                  placeholder="DD/MM/AAAA"
                  value={filtros.dataFim}
                  onChangeText={(v) => setFiltro('dataFim', maskDate(v))}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <Select
              label="Status Chamada"
              value={filtros.statusChamada}
              options={STATUS_OPTIONS}
              onChange={(v) => setFiltro('statusChamada', v)}
            />
            <Select
              label="Escola"
              value={filtros.escola}
              options={escolaOptions}
              onChange={(v) => setFiltro('escola', v)}
            />
            <Select
              label="Ordenar por"
              value={filtros.ordem}
              options={ORDEM_OPTIONS}
              onChange={(v) => setFiltro('ordem', v)}
            />
            {filtrosAtivos > 0 ? (
              <TouchableOpacity onPress={() => setFiltros(FILTROS_INICIAIS)} style={styles.limpar}>
                <Text style={styles.limparText}>Limpar filtros</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </Card>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 28 + (Platform.OS === 'android' ? keyboardInset : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={header}
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Ionicons name="time-outline" size={40} color={colors.border} />
              <Text style={styles.emptyTitle}>Nenhum registro encontrado</Text>
              <Text style={styles.emptyText}>
                {historico.length === 0
                  ? 'Não há histórico de chamadas para este itinerário.'
                  : 'Tente ajustar os filtros para encontrar registros.'}
              </Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.aluno} numberOfLines={1}>
                  {item.nomeAluno}
                </Text>
                <View style={[styles.badge, item.presente ? styles.ok : styles.no]}>
                  <Text style={[styles.badgeText, item.presente ? styles.okText : styles.noText]}>
                    {item.presente ? 'Presente' : 'Ausente'}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {item.escola}
                {item.sala ? ` • Sala ${item.sala}` : ''}
              </Text>
              <Text style={styles.meta}>Responsável: {item.responsavel}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.meta}>
                  {item.data} • {item.horarioRegistro}
                </Text>
                <Text style={styles.statusChamada}>
                  {STATUS_CHAMADA_LABELS[item.statusChamada] || item.statusChamada}
                </Text>
              </View>
            </Card>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20 },
  itinerarioInfo: { fontSize: 13, color: colors.textMuted, marginTop: -8, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, paddingHorizontal: 10, paddingVertical: 12 },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  filtrosHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtrosTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  filtrosBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filtrosBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  filtrosBody: { marginTop: 14 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  limpar: { alignSelf: 'flex-end', paddingVertical: 4 },
  limparText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  card: { paddingVertical: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  aluno: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  statusChamada: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ok: { backgroundColor: colors.successBg },
  no: { backgroundColor: colors.errorBg },
  badgeText: { fontSize: 12, fontWeight: '700' },
  okText: { color: colors.success },
  noText: { color: colors.error },
  emptyCard: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
