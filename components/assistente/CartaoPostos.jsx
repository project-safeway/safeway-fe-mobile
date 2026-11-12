import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { formatCurrency, isoToBR } from '../../utils/formatters';
import { montarLinkMapa } from '../../utils/mensagens';

const PRODUTO = { GASOLINA: 'Gasolina', ETANOL: 'Etanol', DIESEL: 'Diesel' };

const nomeProduto = (produto) =>
  PRODUTO[produto] ?? (produto ? produto.charAt(0) + produto.slice(1).toLowerCase().replace(/_/g, ' ') : 'Combustível');

/**
 * Lista de postos da ação SUGERIR_POSTOS (preços da ANP carregados pelo ETL).
 * @param {Object} props
 * @param {{ produto: string, municipio: string, dataColeta: string, postos: Object[] }} props.acao
 */
export function CartaoPostos({ acao }) {
  const postos = acao.postos || [];

  const abrirMapa = (posto) => {
    Linking.openURL(montarLinkMapa(posto)).catch(() =>
      Alert.alert('Mapa indisponível', 'Não consegui abrir o mapa neste celular.')
    );
  };

  return (
    <View style={styles.cartao}>
      <View style={styles.topo}>
        <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
        <Text style={styles.titulo}>
          {nomeProduto(acao.produto)}
          {acao.municipio ? ` em ${acao.municipio}` : ''}
        </Text>
      </View>
      {acao.dataColeta ? (
        <Text style={styles.coleta}>Preços da ANP coletados em {isoToBR(acao.dataColeta)}</Text>
      ) : null}

      {postos.length ? (
        postos.map((posto, indice) => (
          <View key={`${posto.revenda}-${indice}`} style={[styles.posto, indice > 0 && styles.postoBorda]}>
            <View style={styles.postoInfo}>
              <Text style={styles.revenda} numberOfLines={1}>
                {posto.revenda}
              </Text>
              {posto.bandeira ? <Text style={styles.bandeira}>{posto.bandeira}</Text> : null}
              <Text style={styles.endereco} numberOfLines={2}>
                {[posto.endereco, posto.bairro].filter(Boolean).join(' - ')}
              </Text>
            </View>
            <View style={styles.direita}>
              <Text style={styles.preco}>{formatCurrency(posto.precoVenda)}</Text>
              <TouchableOpacity
                style={styles.mapa}
                onPress={() => abrirMapa(posto)}
                accessibilityLabel={`Abrir ${posto.revenda} no mapa`}
              >
                <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                <Text style={styles.mapaTexto}>Mapa</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.vazio}>Nenhum posto encontrado.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.text },
  coleta: { marginTop: 2, marginBottom: 6, fontSize: 12, color: colors.textMuted },
  posto: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  postoBorda: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  postoInfo: { flex: 1, gap: 2 },
  revenda: { fontSize: 14, fontWeight: '700', color: colors.text },
  bandeira: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },
  endereco: { fontSize: 12, color: colors.textSecondary },
  direita: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 6 },
  preco: { fontSize: 16, fontWeight: '800', color: colors.text },
  mapa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mapaTexto: { fontSize: 12, fontWeight: '700', color: colors.primary },
  vazio: { marginTop: 6, fontSize: 13, color: colors.textMuted },
});
