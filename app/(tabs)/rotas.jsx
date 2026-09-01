import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { mockRotas } from '../../data/mock';

const statusConfig = {
  done: {
    icon: 'checkmark-circle',
    color: colors.success,
    label: (name, status) => `${name} (${status === 'embarcado' ? 'Embarcado' : status})`,
  },
  absent: {
    icon: 'close-circle',
    color: colors.error,
    label: (name) => `${name} (Ausente)`,
  },
  next: {
    icon: 'ellipse',
    color: colors.primary,
    label: (name) => `${name} (Próximo)`,
  },
  pending: {
    icon: 'ellipse-outline',
    color: colors.textMuted,
    label: (name) => name,
  },
};

export default function RotasScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader eyebrow="Visualização Ativa" title="Mapa da Rota" />

        <Card style={styles.mapCard}>
          <View style={styles.mapOverlay}>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS Conectado</Text>
            </View>
            <TouchableOpacity style={styles.locateBtn}>
              <Ionicons name="locate-outline" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapVisual}>
            <View style={styles.routeLine} />
            <View style={styles.youAreHere}>
              <Ionicons name="location" size={22} color={colors.mapBlue} />
              <Text style={styles.youText}>YOU ARE HERE</Text>
            </View>
            <View style={[styles.stopDot, { top: 40, left: 50 }]} />
            <View style={[styles.stopDot, { top: 80, left: 140 }]} />
            <View style={[styles.stopDot, { top: 120, right: 60 }]} />
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Distância</Text>
            <Text style={styles.statValue}>{mockRotas.distancia}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Tempo Estimado</Text>
            <Text style={styles.statValue}>{mockRotas.tempoEstimado}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Pontos</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{mockRotas.pontos}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Monitoramento da Rota</Text>

        {mockRotas.paradas.map((parada) => {
          const config = statusConfig[parada.type];
          const isNext = parada.type === 'next';
          return (
            <Card
              key={parada.id}
              style={[styles.stopCard, isNext && styles.stopCardNext]}
            >
              <View style={styles.stopRow}>
                <Ionicons name={config.icon} size={22} color={config.color} />
                <Text style={[styles.stopName, isNext && styles.stopNameNext]}>
                  {config.label(parada.name, parada.status)}
                </Text>
                <Text
                  style={[
                    styles.stopTime,
                    { color: config.color },
                    parada.type === 'pending' && { color: colors.textMuted },
                  ]}
                >
                  {parada.time}
                </Text>
              </View>
            </Card>
          );
        })}
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
  mapCard: {
    padding: 0,
    overflow: 'hidden',
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  gpsText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  locateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(40,30,24,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapVisual: {
    height: 180,
    backgroundColor: '#E8F1F8',
    position: 'relative',
  },
  routeLine: {
    position: 'absolute',
    top: 50,
    left: 40,
    right: 40,
    height: 4,
    backgroundColor: colors.mapBlue,
    borderRadius: 2,
    transform: [{ rotate: '12deg' }],
  },
  youAreHere: {
    position: 'absolute',
    top: 70,
    left: 90,
    alignItems: 'center',
  },
  youText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mapBlue,
    marginTop: 2,
  },
  stopDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mapBlue,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  stopCard: {
    paddingVertical: 14,
  },
  stopCardNext: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stopName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  stopNameNext: {
    color: colors.primaryDark,
  },
  stopTime: {
    fontSize: 13,
    fontWeight: '700',
  },
});
