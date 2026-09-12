import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { mockItinerario } from '../../data/mock';

export default function ItinerarioScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={mockItinerario}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <ScreenHeader
              eyebrow="Itinerário do Dia"
              title="Rotas & Embarques"
              right={
                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={() => Alert.alert('Reordenar', 'Arraste os cards para reorganizar (mock).')}
                >
                  <Ionicons name="list-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.reorderText}>Reordenar</Text>
                </TouchableOpacity>
              }
            />
            <Text style={styles.sectionLabel}>Ordem de coleta manhã</Text>
          </>
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.id}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.topLine}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.address}>{item.address}</Text>
              </View>
              <Ionicons name="apps-outline" size={16} color={colors.textMuted} style={styles.handle} />
            </View>
          </Card>
        )}
      />
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
    paddingBottom: 24,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reorderText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    marginTop: -8,
  },
  card: {
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  address: {
    fontSize: 13,
    color: colors.textMuted,
  },
  handle: {
    marginLeft: 8,
    marginTop: 28,
  },
});
