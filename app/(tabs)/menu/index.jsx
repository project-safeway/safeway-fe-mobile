import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';

const menuItems = [
  {
    key: 'alunos',
    title: 'Alunos',
    subtitle: 'Gestão escolar',
    icon: 'people-outline',
    href: '/(tabs)/alunos',
  },
  {
    key: 'chamada',
    title: 'Chamada',
    subtitle: 'Diário de bordo',
    icon: 'clipboard-outline',
    href: '/(tabs)/chamada',
  },
  {
    key: 'escolas',
    title: 'Escolas',
    subtitle: 'Instituições',
    icon: 'business-outline',
    href: '/(tabs)/menu/escolas',
  },
  {
    key: 'financeiro',
    title: 'Financeiro',
    subtitle: 'Fluxo de caixa',
    icon: 'wallet-outline',
    href: '/(tabs)/financeiro',
  },
  {
    key: 'itinerario',
    title: 'Itinerário',
    subtitle: 'Pontos de embarque',
    icon: 'location-outline',
    href: '/(tabs)/itinerario',
  },
  {
    key: 'rotas',
    title: 'Rotas',
    subtitle: 'Mapas e tempos',
    icon: 'navigate-outline',
    href: '/(tabs)/rotas',
  },
];

export default function MenuDashboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Painel Geral</Text>
            <Text style={styles.greeting}>Olá, Motorista Carlos</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusText}>
            <Text style={styles.statusLabel}>STATUS DA ROTA ATUAL</Text>
            <Text style={styles.statusTitle}>Rota Escolar da Manhã</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>Em andamento</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.gridItem}
              activeOpacity={0.85}
              onPress={() => router.push(item.href)}
            >
              <Card style={styles.menuCard}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={22} color={colors.primary} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusCard: {
    backgroundColor: '#3A4556',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statusText: {
    flex: 1,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 11,
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  statusBadge: {
    backgroundColor: '#D8DEE6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A4556',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
  },
  menuCard: {
    marginBottom: 0,
    minHeight: 128,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
