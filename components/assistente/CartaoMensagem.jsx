import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { formatPhone } from '../../utils/formatters';

const MOTIVO = { ATRASO_GERAL: 'Aviso de atraso', ATRASO_ALUNO: 'Aviso sobre o aluno' };
const primeiroNome = (nome) => String(nome || '').split(' ')[0];

/**
 * Rascunho de mensagem ao responsável (ação ENVIAR_MENSAGEM_RESPONSAVEL). Nada é enviado pelo app:
 * "Enviar" abre o WhatsApp com o texto pronto e o motorista confirma lá.
 * @param {Object} props
 * @param {{ id: string, acao: Object, mensagem: string, status: 'pendente'|'aberto'|'descartado' }} props.rascunho
 * @param {() => void} props.onEnviar
 * @param {(texto: string) => void} props.onSalvarEdicao
 * @param {() => void} props.onDescartar
 */
export function CartaoMensagem({ rascunho, onEnviar, onSalvarEdicao, onDescartar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(rascunho.mensagem);
  const { acao, status } = rascunho;
  const descartado = status === 'descartado';

  const salvar = () => {
    const limpo = texto.trim();
    if (!limpo) return;
    onSalvarEdicao(limpo);
    setEditando(false);
  };

  return (
    <View style={[styles.cartao, descartado && styles.cartaoDescartado]}>
      <View style={styles.topo}>
        <Ionicons name="logo-whatsapp" size={16} color={colors.whatsapp} />
        <Text style={styles.motivo}>{MOTIVO[acao.motivo] ?? 'Mensagem pronta'}</Text>
        {status === 'aberto' ? (
          <Text style={[styles.selo, styles.seloAberto]}>Aberta no WhatsApp</Text>
        ) : descartado ? (
          <Text style={[styles.selo, styles.seloDescartado]}>Descartada</Text>
        ) : (
          <Text style={[styles.selo, styles.seloPendente]}>Não enviada</Text>
        )}
      </View>

      <Text style={styles.para} numberOfLines={2}>
        Para <Text style={styles.forte}>{acao.responsavelNome}</Text>
        {acao.nomeAluno ? ` · responsável por ${primeiroNome(acao.nomeAluno)}` : ''}
      </Text>
      <Text style={styles.telefone}>{formatPhone(String(acao.telefone || '').replace(/^55/, ''))}</Text>

      {editando ? (
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          multiline
          autoFocus
          maxLength={1000}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Texto da mensagem"
        />
      ) : (
        <Text style={[styles.mensagem, descartado && styles.riscado]}>{rascunho.mensagem}</Text>
      )}

      {descartado ? null : editando ? (
        <View style={styles.botoes}>
          <TouchableOpacity style={[styles.botao, styles.botaoPrincipal]} onPress={salvar}>
            <Text style={styles.botaoPrincipalTexto}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.botao}
            onPress={() => {
              setTexto(rascunho.mensagem);
              setEditando(false);
            }}
          >
            <Text style={styles.botaoTexto}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.botoes}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoWhatsapp]}
            onPress={onEnviar}
            accessibilityLabel={`Abrir WhatsApp para ${acao.responsavelNome}`}
          >
            <Ionicons name="logo-whatsapp" size={15} color={colors.white} />
            <Text style={styles.botaoPrincipalTexto}>{status === 'aberto' ? 'Abrir de novo' : 'Enviar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao} onPress={() => setEditando(true)}>
            <Ionicons name="create-outline" size={15} color={colors.text} />
            <Text style={styles.botaoTexto}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botao} onPress={onDescartar}>
            <Ionicons name="trash-outline" size={15} color={colors.error} />
            <Text style={[styles.botaoTexto, styles.textoErro]}>Descartar</Text>
          </TouchableOpacity>
        </View>
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
    gap: 6,
  },
  cartaoDescartado: { opacity: 0.55 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  motivo: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  selo: { fontSize: 10, fontWeight: '700', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  seloPendente: { backgroundColor: colors.warningBg, color: colors.warningText },
  seloAberto: { backgroundColor: colors.successBg, color: colors.success },
  seloDescartado: { backgroundColor: colors.borderLight, color: colors.textMuted },
  para: { fontSize: 14, color: colors.text },
  forte: { fontWeight: '700' },
  telefone: { fontSize: 12, color: colors.textMuted },
  mensagem: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    backgroundColor: colors.backgroundAlt,
    borderRadius: 10,
    padding: 10,
  },
  riscado: { textDecorationLine: 'line-through' },
  input: {
    minHeight: 96,
    maxHeight: 200,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
  },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  botaoWhatsapp: { backgroundColor: colors.whatsapp, borderColor: colors.whatsapp },
  botaoPrincipal: { backgroundColor: colors.primary, borderColor: colors.primary },
  botaoTexto: { fontSize: 13, fontWeight: '700', color: colors.text },
  botaoPrincipalTexto: { fontSize: 13, fontWeight: '700', color: colors.white },
  textoErro: { color: colors.error },
});
