import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

/**
 * @param {Object} props
 * @param {string} [props.label]
 * @param {string} [props.placeholder]
 * @param {string} props.value
 * @param {Array<{ value: string, label: string }>} props.options
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.error]
 * @param {boolean} [props.compact]
 */
export function Select({
  label,
  placeholder = 'Selecione',
  value,
  options,
  onChange,
  error,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {label ? <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.field, compact && styles.fieldCompact, error && styles.fieldError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
      >
        <Text
          style={[styles.value, compact && styles.valueCompact, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              initialScrollIndex={selectedIndex > 3 ? selectedIndex - 2 : undefined}
              getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  wrapperCompact: { marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  labelCompact: { fontSize: 12, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 8,
  },
  fieldCompact: { minHeight: 44, borderRadius: 12, paddingHorizontal: 12 },
  fieldError: { borderColor: colors.error },
  value: { flex: 1, fontSize: 15, color: colors.text },
  valueCompact: { fontSize: 14 },
  placeholder: { color: colors.textMuted },
  error: { marginTop: 6, fontSize: 12, color: colors.error },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  option: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  optionActive: { backgroundColor: colors.primarySoft, borderRadius: 10 },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionTextActive: { color: colors.primary },
});
