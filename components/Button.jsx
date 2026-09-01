import { forwardRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../constants/colors';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {() => void} [props.onPress]
 * @param {'primary' | 'outline' | 'soft'} [props.variant]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {object} [props.style]
 */
export const Button = forwardRef(function Button(
  {
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
  },
  ref
) {
  const isOutline = variant === 'outline';
  const isSoft = variant === 'soft';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      ref={ref}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        isOutline && styles.outline,
        isSoft && styles.soft,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isSoft ? colors.primary : colors.white} />
      ) : (
        <Text
          style={[
            styles.text,
            isOutline && styles.textOutline,
            isSoft && styles.textSoft,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  soft: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  textOutline: {
    color: colors.primary,
  },
  textSoft: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
});
