import { View, Text, StyleSheet } from 'react-native';
import { STATUS_MENSALIDADE } from '../../utils/financeiro';

export function StatusBadge({ status }) {
  const config = STATUS_MENSALIDADE[status] || STATUS_MENSALIDADE.PENDENTE;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '700' },
});
