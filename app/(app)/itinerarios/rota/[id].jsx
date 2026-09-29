import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { colors } from '../../../../constants/colors';
import { mockItinerarios } from '../../../../data/mock';

export default function RotaScreen() {
  const { id } = useLocalSearchParams();
  const itinerario = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );
  const alunos = [...(itinerario.alunos || [])].sort(
    (a, b) => (a.ordemEmbarque || 0) - (b.ordemEmbarque || 0)
  );

  return (
    <KeyboardScreen>
      <BackHeader title="Rota" subtitle={itinerario.nome} />

      <Card style={styles.mapCard}>
        <View style={styles.mapVisual}>
          <View style={styles.routeLine} />
          <View style={styles.pin}>
            <Ionicons name="bus" size={22} color={colors.mapBlue} />
            <Text style={styles.pinText}>ROTA</Text>
          </View>
        </View>
        <Text style={styles.mapHint}>
          Visualização mockada da rota otimizada ({alunos.length} pontos)
        </Text>
      </Card>

      <Card style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Início</Text>
          <Text style={styles.statValue}>{itinerario.horarioInicio}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Fim</Text>
          <Text style={styles.statValue}>{itinerario.horarioFim}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Paradas</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{alunos.length}</Text>
        </View>
      </Card>

      <Text style={styles.section}>Ordem do trajeto</Text>
      {alunos.map((aluno, index) => (
        <Card key={aluno.alunoId} style={styles.stop}>
          <View style={styles.stopRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{aluno.nomeAluno}</Text>
              <Text style={styles.stopMeta}>{aluno.nomeEscola}</Text>
            </View>
          </View>
        </Card>
      ))}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  mapCard: { padding: 0, overflow: 'hidden', marginBottom: 12 },
  mapVisual: {
    height: 160,
    backgroundColor: '#E8F1F8',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    top: 70,
    left: 30,
    right: 40,
    height: 4,
    backgroundColor: colors.mapBlue,
    borderRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  pin: { position: 'absolute', top: 48, left: 80, alignItems: 'center' },
  pinText: { fontSize: 10, fontWeight: '700', color: colors.mapBlue, marginTop: 2 },
  mapHint: {
    padding: 12,
    fontSize: 12,
    color: colors.textMuted,
  },
  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  divider: { width: 1, height: 34, backgroundColor: colors.borderLight },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  stop: { paddingVertical: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '700', color: colors.text },
  stopMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
});
