import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

/**
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.placeholder]
 * @param {string} [props.value]
 * @param {(text: string) => void} [props.onChangeText]
 * @param {keyof typeof Ionicons.glyphMap} [props.leftIcon]
 * @param {boolean} [props.isPassword]
 * @param {string} [props.error]
 * @param {string} [props.keyboardType]
 * @param {string} [props.autoCapitalize]
 * @param {boolean} [props.editable]
 * @param {'default' | 'pill'} [props.variant]
 */
export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  leftIcon,
  isPassword = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  variant = 'default',
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPill = variant === 'pill';

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          isPill && styles.fieldPill,
          error && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  fieldPill: {
    borderRadius: 26,
    borderColor: colors.primaryBorder,
  },
  fieldError: {
    borderColor: colors.error,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error,
  },
});
