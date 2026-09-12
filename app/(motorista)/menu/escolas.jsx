import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockEscolas } from '../../../data/mock';

export default function EscolasScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={mockEscolas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              accessibilityLabel="Voltar ao menu"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
            <ScreenHeader
              eyebrow="Instituições"
              title="Escolas Atendidas"
              subtitle={`${mockEscolas.length} escolas ativas`}
              right={
                <TouchableOpacity
                  style={styles.newBtn}
                  onPress={() => Alert.alert('Em breve', 'Cadastro de escola será integrado depois.')}
                >
                  <Text style={styles.newBtnText}>+ Nova Escola</Text>
                </TouchableOpacity>
              }
            />
          </>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.cardTop}>
              <Text style={styles.schoolName}>{item.name}</Text>
              <TouchableOpacity style={styles.editBtn} accessibilityLabel="Editar escola">
                <Ionicons name="pencil-outline" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.address}>{item.address}</Text>
            <View style={styles.divider} />
            <View style={styles.cardBottom}>
              <View style={styles.studentsRow}>
                <Ionicons name="people" size={16} color={colors.primary} />
                <Text style={styles.studentsText}>{item.students} alunos cadastrados</Text>
              </View>
              <Text style={styles.phone}>{item.phone}</Text>
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
    paddingTop: 8,
    paddingBottom: 24,
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
    marginBottom: 12,
  },
  newBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  schoolName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  address: {
    fontSize: 13,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentsText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  phone: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
