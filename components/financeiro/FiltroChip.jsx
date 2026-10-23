import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {boolean} props.active
 * @param {() => void} props.onPress
 * @param {string} [props.color] cor de destaque quando ativo
 */
export function FiltroChip({ label, active, onPress, color = colors.primary }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
      {active ? <Ionicons name="close" size={14} color={colors.white} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  text: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  textActive: { color: colors.white },
});
