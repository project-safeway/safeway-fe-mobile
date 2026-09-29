import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export function BackHeader({ title, subtitle, onBack, right, showBack = true }) {
  return (
    <View style={styles.wrap}>
      {(showBack || right) && (
        <View style={styles.top}>
          {showBack ? (
            <TouchableOpacity
              style={styles.back}
              onPress={onBack || (() => router.back())}
              accessibilityLabel="Voltar"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <View style={styles.spacer} />
          )}
          {right ? <View style={styles.right}>{right}</View> : <View style={styles.spacer} />}
        </View>
      )}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 40 },
  right: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
});
