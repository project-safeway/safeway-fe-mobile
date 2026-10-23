import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../../constants/colors';

const LINHAS_GRADE = 4;

function topoDaEscala(maximo) {
  if (maximo <= 0) return 1;
  const bruto = maximo / LINHAS_GRADE;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= bruto);
  return passo * LINHAS_GRADE;
}

/**
 * Barras agrupadas (receita x despesas) por mês.
 * @param {Object} props
 * @param {Array<{ key: string, label: string, receita: number, despesas: number }>} props.data
 * @param {string} [props.selectedKey]
 * @param {(key: string) => void} [props.onSelect]
 * @param {number} [props.height]
 */
export function BarChart({ data, selectedKey, onSelect, height = 150 }) {
  const topo = topoDaEscala(Math.max(0, ...data.flatMap((d) => [d.receita, d.despesas])));
  const altura = (valor) => (valor > 0 ? Math.max(3, (valor / topo) * height) : 0);

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {Array.from({ length: LINHAS_GRADE + 1 }, (_, i) => (
          <View key={i} style={[styles.gridLine, { bottom: (height / LINHAS_GRADE) * i }]} />
        ))}
        {data.map((d) => {
          const ativo = !selectedKey || selectedKey === d.key;
          return (
            <Pressable
              key={d.key}
              style={[styles.group, !ativo && styles.groupInativo]}
              onPress={() => onSelect?.(d.key)}
              accessibilityRole="button"
              accessibilityLabel={`${d.label}: receita ${d.receita}, despesas ${d.despesas}`}
            >
              <View style={[styles.bar, styles.receita, { height: altura(d.receita) }]} />
              <View style={[styles.bar, styles.despesa, { height: altura(d.despesas) }]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d) => (
          <Text
            key={d.key}
            style={[styles.label, selectedKey === d.key && styles.labelAtivo]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFAF5',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  gridLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.chartGrid },
  group: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: '100%' },
  groupInativo: { opacity: 0.35 },
  bar: { width: 13, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  receita: { backgroundColor: colors.primary },
  despesa: { backgroundColor: colors.chartBrown },
  labels: { flexDirection: 'row', paddingHorizontal: 4, marginTop: 6 },
  label: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  labelAtivo: { color: colors.primary },
});
