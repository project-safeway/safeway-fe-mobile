import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../constants/colors';

/**
 * Indicador de carregamento ou mensagem de erro com botão para tentar de novo.
 * @param {Object} props
 * @param {Error|null} [props.erro]
 * @param {() => void} [props.onTentarNovamente]
 */
export function EstadoCarregamento({ erro, onTentarNovamente }) {
  if (!erro) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
      <Text style={styles.texto}>{erro.message || 'Não foi possível carregar os dados.'}</Text>
      {onTentarNovamente ? (
        <Button title="Tentar novamente" variant="outline" onPress={onTentarNovamente} style={styles.botao} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  texto: { textAlign: 'center', color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  botao: { minWidth: 180, borderRadius: 12 },
});
