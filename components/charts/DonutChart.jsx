import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../constants/colors';

const ESPACO_ENTRE_FATIAS = 2;

/**
 * @param {Object} props
 * @param {Array<{ key: string, color: string, valor: number }>} props.fatias
 * @param {string} [props.titulo]
 * @param {string} [props.valor]
 * @param {number} [props.size]
 * @param {number} [props.strokeWidth]
 */
export function DonutChart({ fatias, titulo, valor, size = 140, strokeWidth = 22 }) {
  const raio = (size - strokeWidth) / 2;
  const centro = size / 2;
  const circunferencia = 2 * Math.PI * raio;
  const total = fatias.reduce((acc, f) => acc + f.valor, 0);
  const visiveis = fatias.filter((f) => f.valor > 0);
  const espaco = visiveis.length > 1 ? ESPACO_ENTRE_FATIAS : 0;

  let acumulado = 0;
  const arcos = visiveis.map((fatia) => {
    const comprimento = (fatia.valor / total) * circunferencia;
    const arco = {
      key: fatia.key,
      color: fatia.color,
      dash: `${Math.max(0, comprimento - espaco)} ${circunferencia}`,
      offset: -acumulado,
    };
    acumulado += comprimento;
    return arco;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={centro} cy={centro} r={raio} stroke={colors.borderLight} strokeWidth={strokeWidth} fill="none" />
        <G rotation={-90} origin={`${centro}, ${centro}`}>
          {arcos.map((arco) => (
            <Circle
              key={arco.key}
              cx={centro}
              cy={centro}
              r={raio}
              stroke={arco.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arco.dash}
              strokeDashoffset={arco.offset}
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.centro]} pointerEvents="none">
        {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
        {valor ? <Text style={styles.valor}>{valor}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 12, color: colors.textSecondary },
  valor: { fontSize: 15, fontWeight: '700', color: colors.text },
});
