import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockConversasMotorista } from '../../../data/mock';

export default function MotoristaMensagensScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Mensagens</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <FlatList
        data={mockConversasMotorista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/(motorista)/menu/chat/${item.id}`)}
          >
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={22} color={colors.textSecondary} />
                  {item.online ? <View style={styles.online} /> : null}
                </View>
                <View style={styles.info}>
                  <View style={styles.topLine}>
                    <Text style={styles.name}>{item.nome}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                  </View>
                  <Text style={styles.aluno}>Aluno: {item.aluno}</Text>
                  <Text style={styles.last} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
                {item.unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 40 },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E2DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  online: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  info: { flex: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  aluno: { fontSize: 12, color: colors.primary, marginBottom: 2 },
  last: { fontSize: 13, color: colors.textMuted },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});
