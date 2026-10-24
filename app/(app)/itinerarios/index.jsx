import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Card } from '../../../components/Card';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { colors } from '../../../constants/colors';
import { useCarregar } from '../../../hooks/useCarregar';
import { excluirItinerario, listarItinerarios } from '../../../services/itinerarios';
import { horaCurta } from '../../../utils/formatters';
import { TIPO_VIAGEM_LABELS } from '../../../utils/constants';

export default function ItinerariosScreen() {
  const { dados: lista, setDados: setLista, erro, recarregar } = useCarregar(listarItinerarios);

  const excluir = (id, nome) => {
    Alert.alert('Excluir itinerário', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirItinerario(id);
            setLista((prev) => prev.filter((i) => i.id !== id));
          } catch (e) {
            Alert.alert('Não foi possível excluir', e.message);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={lista ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <BackHeader
              title="Itinerários"
              subtitle="Gerencie suas rotas de transporte"
              showBack={false}
            />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/(app)/itinerarios/cadastrar')}
            >
              <Text style={styles.createText}>+ Cadastrar Itinerário</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={
          lista ? (
            <Text style={styles.empty}>Nenhum itinerário cadastrado.</Text>
          ) : (
            <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.head}>
              <View style={styles.headText}>
                <Text style={styles.name}>{item.name}</Text>
                <View
                  style={[
                    styles.badge,
                    item.routeType === 'TO_SCHOOL' ? styles.badgeIda : styles.badgeVolta,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      item.routeType === 'TO_SCHOOL' ? styles.badgeTextIda : styles.badgeTextVolta,
                    ]}
                  >
                    {TIPO_VIAGEM_LABELS[item.routeType] ?? item.routeType}
                  </Text>
                </View>
              </View>
              <View style={styles.icons}>
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/itinerarios/editar/${item.id}`)}
                  accessibilityLabel="Editar"
                >
                  <Ionicons name="create-outline" size={18} color={colors.mapBlue} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => excluir(item.id, item.name)}
                  accessibilityLabel="Excluir"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/itinerarios/historico/${item.id}`)}
                  accessibilityLabel="Histórico"
                >
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.horario}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.horarioText}>
                {horaCurta(item.startTime) || '--:--'} - {horaCurta(item.endTime) || '--:--'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.presencaBtn}
              onPress={() => router.push(`/(app)/itinerarios/rota/${item.id}`)}
            >
              <Ionicons name="navigate" size={18} color={colors.white} />
              <Text style={styles.presencaText}>Iniciar Rota</Text>
            </TouchableOpacity>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  createText: { color: colors.white, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  card: { gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  headText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeIda: { backgroundColor: colors.successBg },
  badgeVolta: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextIda: { color: colors.success },
  badgeTextVolta: { color: '#B45309' },
  icons: { flexDirection: 'row', gap: 12, paddingTop: 2 },
  horario: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  horarioText: { fontSize: 14, color: colors.textSecondary },
  presencaBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  presencaText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
