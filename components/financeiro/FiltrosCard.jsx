import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../Card';
import { colors } from '../../constants/colors';

/**
 * Cartão de filtros recolhível.
 * @param {Object} props
 * @param {number} props.ativos quantidade de filtros diferentes do padrão
 * @param {() => void} props.onLimpar
 * @param {React.ReactNode} props.children
 */
export function FiltrosCard({ ativos, onLimpar, children }) {
  const [aberto, setAberto] = useState(false);

  return (
    <Card>
      <TouchableOpacity style={styles.head} onPress={() => setAberto((v) => !v)}>
        <Ionicons name="options-outline" size={18} color={colors.text} />
        <Text style={styles.title}>Filtros</Text>
        {ativos > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{ativos}</Text>
          </View>
        ) : null}
        <View style={styles.flex} />
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {aberto ? (
        <View style={styles.body}>
          {children}
          {ativos > 0 ? (
            <TouchableOpacity onPress={onLimpar} style={styles.limpar}>
              <Ionicons name="close-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.limparText}>Limpar filtros</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  flex: { flex: 1 },
  body: { marginTop: 14 },
  limpar: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingVertical: 4 },
  limparText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
