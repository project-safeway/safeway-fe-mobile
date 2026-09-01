import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

/**
 * @param {Object} props
 * @param {string} [props.eyebrow]
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.right]
 */
export function ScreenHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  textBlock: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  right: {
    paddingTop: 4,
  },
});
