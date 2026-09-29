import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { mockMotorista } from '../../data/mock';

const modules = [
  {
    key: 'alunos',
    title: 'Alunos',
    description: 'Cadastro e gestão de alunos',
    icon: 'school-outline',
    href: '/(app)/alunos',
  },
  {
    key: 'itinerarios',
    title: 'Itinerário',
    description: 'Configure itinerários e horários',
    icon: 'map-outline',
    href: '/(app)/itinerarios',
  },
  {
    key: 'financeiro',
    title: 'Financeiro',
    description: 'Controle financeiro e pagamentos',
    icon: 'cash-outline',
    href: '/(app)/financeiro',
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SafeWay</Text>
            <Text style={styles.greeting}>Olá, {mockMotorista.nome.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>Sistema de Transporte Escolar</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(app)/perfil')}
            accessibilityLabel="Abrir perfil"
          >
            {mockMotorista.fotoUri ? (
              <Image source={{ uri: mockMotorista.fotoUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={22} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.section}>Módulos do Sistema</Text>

        <View style={styles.grid}>
          {modules.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              onPress={() => router.push(item.href)}
            >
              <Card style={styles.card}>
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  headerText: { flex: 1 },
  eyebrow: { fontSize: 13, color: colors.primary, fontWeight: '700', marginBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  grid: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 0,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
  cardDesc: { fontSize: 13, color: colors.textMuted },
});
