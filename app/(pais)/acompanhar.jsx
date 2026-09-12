import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../constants/colors';
import { mockAcompanharRota } from '../../data/mock';

export default function AcompanharScreen() {
  const data = mockAcompanharRota;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Tempo real"
          title="Acompanhar Rota"
          subtitle={`${data.aluno.nome} • ${data.status}`}
        />

        <Card style={styles.mapCard}>
          <View style={styles.mapOverlay}>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>Van localizada</Text>
            </View>
          </View>
          <View style={styles.mapVisual}>
            <View style={styles.routeLine} />
            <View style={styles.pin}>
              <Ionicons name="bus" size={22} color={colors.mapBlue} />
              <Text style={styles.pinText}>VAN</Text>
            </View>
            <View style={styles.homePin}>
              <Ionicons name="home" size={18} color={colors.primary} />
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Chegada</Text>
            <Text style={styles.statValue}>{data.eta}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distância</Text>
            <Text style={styles.statValue}>{data.distancia}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Motorista</Text>
            <Text style={[styles.statValue, { color: colors.primary, fontSize: 13 }]}>
              {data.motorista.nome.split(' ')[0]}
            </Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Pontos da rota</Text>
        {data.paradas.map((parada) => (
          <Card
            key={parada.id}
            style={[styles.stopCard, parada.current && styles.stopCurrent]}
          >
            <View style={styles.stopRow}>
              <Ionicons
                name={parada.done ? 'checkmark-circle' : parada.current ? 'ellipse' : 'ellipse-outline'}
                size={22}
                color={
                  parada.done
                    ? colors.success
                    : parada.current
                      ? colors.primary
                      : colors.textMuted
                }
              />
              <Text style={styles.stopLabel}>{parada.label}</Text>
              <Text
                style={[
                  styles.stopTime,
                  parada.current && { color: colors.primary },
                  parada.done && { color: colors.success },
                ]}
              >
                {parada.time}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  mapCard: { padding: 0, overflow: 'hidden' },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(40,30,24,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  gpsText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  mapVisual: {
    height: 180,
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
  pin: { position: 'absolute', top: 50, left: 70, alignItems: 'center' },
  pinText: { fontSize: 10, fontWeight: '700', color: colors.mapBlue, marginTop: 2 },
  homePin: { position: 'absolute', bottom: 36, right: 50 },
  statsCard: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  statDivider: { width: 1, height: 34, backgroundColor: colors.borderLight },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  stopCard: { paddingVertical: 14 },
  stopCurrent: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  stopTime: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
});
