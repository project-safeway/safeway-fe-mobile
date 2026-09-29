import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { colors } from '../../../../constants/colors';
import { mockHistoricoChamadas, mockItinerarios } from '../../../../data/mock';
import { formatDate } from '../../../../utils/formatters';

export default function HistoricoScreen() {
  const { id } = useLocalSearchParams();
  const itinerario = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );
  const chamadas = mockHistoricoChamadas[itinerario.id] || [];

  const rows = useMemo(() => {
    const list = [];
    chamadas.forEach((chamada) => {
      (chamada.alunos || []).forEach((item, idx) => {
        list.push({
          key: `${chamada.id}-${idx}`,
          data: chamada.data,
          aluno: item.aluno?.nome,
          escola: item.aluno?.escola?.nome,
          presente: item.presente,
        });
      });
    });
    return list;
  }, [chamadas]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <BackHeader title="Histórico" subtitle={itinerario.nome} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum registro de chamada encontrado.</Text>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.aluno}>{item.aluno}</Text>
                <Text style={styles.meta}>{item.escola}</Text>
                <Text style={styles.meta}>{formatDate(item.data)}</Text>
              </View>
              <View style={[styles.badge, item.presente ? styles.ok : styles.no]}>
                <Text style={[styles.badgeText, item.presente ? styles.okText : styles.noText]}>
                  {item.presente ? 'Presente' : 'Ausente'}
                </Text>
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  card: { paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, marginRight: 10 },
  aluno: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  ok: { backgroundColor: colors.successBg },
  no: { backgroundColor: colors.errorBg },
  badgeText: { fontSize: 12, fontWeight: '700' },
  okText: { color: colors.success },
  noText: { color: colors.error },
});
