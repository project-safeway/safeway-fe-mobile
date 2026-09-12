import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { colors } from '../../constants/colors';
import { mockAlunos } from '../../data/mock';

export default function AlunosScreen() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mockAlunos;
    return mockAlunos.filter(
      (aluno) =>
        aluno.name.toLowerCase().includes(term) ||
        aluno.school.toLowerCase().includes(term) ||
        aluno.guardian.toLowerCase().includes(term)
    );
  }, [search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <ScreenHeader eyebrow="Estudantes" title="Alunos Cadastrados" />
            <View style={styles.controls}>
              <View style={styles.search}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar aluno..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity
                style={styles.newBtn}
                onPress={() => Alert.alert('Em breve', 'Cadastro de aluno será integrado depois.')}
              >
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Novo</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum aluno encontrado.</Text>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardTop}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.school}>{item.school}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  accessibilityLabel="Gerar convite"
                  onPress={() =>
                    Alert.alert(
                      'Link de convite',
                      `safeway://convite/${item.inviteId}\n\nCompartilhe este link com o responsável.`,
                      [
                        { text: 'Fechar', style: 'cancel' },
                        {
                          text: 'Abrir tela',
                          onPress: () => router.push(`/convite/${item.inviteId}`),
                        },
                      ]
                    )
                  }
                >
                  <Ionicons name="link-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Editar aluno">
                  <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Ver aluno">
                  <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.respLabel}>RESPONSÁVEL</Text>
                <Text style={styles.respName}>{item.guardian}</Text>
              </View>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
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
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 46,
  },
  newText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 24,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  school: {
    marginTop: 4,
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  respLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  respName: {
    fontSize: 14,
    color: colors.textSlate,
    fontWeight: '500',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
