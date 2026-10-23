import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { colors } from '../../constants/colors';
import { useChamada } from '../../contexts/ChamadaContext';
import { useFinanceiro } from '../../contexts/FinanceiroContext';
import { useTranscricao } from '../../hooks/useTranscricao';
import { enviarMensagem, usandoMockIA } from '../../services/ia';

let proximoId = 1;
const novaMensagem = (dados) => ({ id: String(proximoId++), ...dados });
const primeiroNome = (nome) => String(nome || '').split(' ')[0];

export default function AssistenteScreen() {
  const { chamada, marcarPresenca } = useChamada();
  const { mensalidades, pagamentos } = useFinanceiro();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const conversaIdRef = useRef(null);
  const listaRef = useRef(null);
  const contextoRef = useRef(null);
  contextoRef.current = { chamada, mensalidades, pagamentos };

  const palavrasEsperadas = useMemo(
    () => (chamada?.alunos || []).flatMap((a) => [a.nome, primeiroNome(a.nome)]),
    [chamada?.alunos]
  );

  const totalPresentes = chamada ? Object.values(chamada.presencas).filter(Boolean).length : 0;

  /** A API já gravou no banco; aqui só refletimos na chamada aberta, guardando o valor anterior para desfazer. */
  const aplicarAcoes = (acoes) => {
    const chamadaAtual = contextoRef.current.chamada;
    if (!chamadaAtual) return [];
    return acoes
      .filter((a) => a.tipo === 'MARCAR_PRESENCA' && a.alunoId in chamadaAtual.presencas)
      .map((a) => {
        const anterior = Boolean(chamadaAtual.presencas[a.alunoId]);
        marcarPresenca(a.alunoId, a.status === 'PRESENTE');
        return { ...a, anterior };
      });
  };

  const enviar = async (conteudo, origem) => {
    const limpo = conteudo.trim();
    if (!limpo || carregando) return;
    setTexto('');
    setMensagens((prev) => [...prev, novaMensagem({ autor: 'motorista', texto: limpo, origem })]);
    setCarregando(true);

    const itinerarioId = contextoRef.current.chamada?.itinerarioId ?? null;
    try {
      const resposta = await enviarMensagem(
        { conversaId: conversaIdRef.current, texto: limpo, itinerarioId },
        contextoRef.current
      );
      conversaIdRef.current = resposta.conversaId;
      const acoes = aplicarAcoes(resposta.acoes);
      setMensagens((prev) => [
        ...prev,
        novaMensagem({ autor: 'ia', texto: resposta.resposta, acoes, itinerarioId }),
      ]);
    } catch (error) {
      console.warn('[ia]', error.message);
      setMensagens((prev) => [
        ...prev,
        novaMensagem({
          autor: 'ia',
          texto: 'Não consegui falar com o assistente agora. Tente de novo em instantes.',
          erro: true,
        }),
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const voz = useTranscricao({
    onTextoFinal: (falado) => enviar(falado, 'voz'),
    palavrasEsperadas,
  });

  const alternarMicrofone = () => {
    Keyboard.dismiss();
    if (voz.ouvindo) voz.parar();
    else voz.iniciar();
  };

  const desfazer = (mensagem) => {
    console.log(
      '[mock] desfazer presenças',
      mensagem.acoes.map((a) => ({ alunoId: a.alunoId, status: a.anterior ? 'PRESENTE' : 'AUSENTE' }))
    );
    mensagem.acoes.forEach((a) => marcarPresenca(a.alunoId, a.anterior));
    setMensagens((prev) => prev.map((m) => (m.id === mensagem.id ? { ...m, desfeito: true } : m)));
  };

  const novaConversa = () => {
    voz.parar();
    conversaIdRef.current = null;
    setMensagens([]);
    setTexto('');
  };

  const sugestoes = chamada
    ? [
        ...(chamada.alunos[0] ? [`${primeiroNome(chamada.alunos[0].nome)} entrou na van`] : []),
        'Quem ainda falta embarcar?',
        'Como está meu financeiro este mês?',
      ]
    : ['Como está meu financeiro este mês?', 'Como foi o mês passado?', 'Quem ainda não pagou?'];

  const temTexto = texto.trim().length > 0;
  const ocupado = carregando && !voz.ouvindo;

  const renderMensagem = ({ item }) => {
    const doMotorista = item.autor === 'motorista';
    const podeDesfazer = !item.desfeito && chamada?.itinerarioId === item.itinerarioId;

    return (
      <View style={[styles.linha, doMotorista && styles.linhaMotorista]}>
        {doMotorista ? null : (
          <View style={styles.avatar}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.balao,
            doMotorista ? styles.balaoMotorista : styles.balaoIA,
            item.erro && styles.balaoErro,
          ]}
        >
          {doMotorista && item.origem === 'voz' ? (
            <View style={styles.origem}>
              <Ionicons name="mic" size={11} color={colors.primarySoft} />
              <Text style={styles.origemTexto}>Por voz</Text>
            </View>
          ) : null}
          <Text style={[styles.textoBalao, doMotorista && styles.textoMotorista]}>{item.texto}</Text>

          {item.acoes?.length ? (
            <View style={styles.acoes}>
              <View style={styles.acoesLista}>
                {item.acoes.map((acao) => {
                  const presente = acao.status === 'PRESENTE';
                  return (
                    <View
                      key={acao.alunoId}
                      style={[
                        styles.acao,
                        presente ? styles.acaoPresente : styles.acaoAusente,
                        item.desfeito && styles.acaoDesfeita,
                      ]}
                    >
                      <Ionicons
                        name={presente ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={presente ? colors.success : colors.error}
                      />
                      <Text style={styles.acaoTexto}>
                        {primeiroNome(acao.nomeAluno)} · {presente ? 'Presente' : 'Ausente'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {item.desfeito ? (
                <Text style={styles.desfeito}>Desfeito</Text>
              ) : podeDesfazer ? (
                <TouchableOpacity onPress={() => desfazer(item)} hitSlop={8}>
                  <Text style={styles.desfazer}>Desfazer</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.topo}>
          <ScreenHeader
            eyebrow="Assistente SafeWay"
            title="Fale com a IA"
            right={
              mensagens.length ? (
                <TouchableOpacity
                  style={styles.novaConversa}
                  onPress={novaConversa}
                  accessibilityLabel="Nova conversa"
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text style={styles.novaConversaTexto}>Nova</Text>
                </TouchableOpacity>
              ) : null
            }
          />
          <View style={[styles.rota, chamada && styles.rotaAtiva]}>
            <Ionicons
              name={chamada ? 'bus' : 'bus-outline'}
              size={18}
              color={chamada ? colors.success : colors.textMuted}
            />
            <Text style={styles.rotaTexto} numberOfLines={2}>
              {chamada
                ? `${chamada.nomeItinerario} em andamento · ${totalPresentes}/${chamada.alunos.length} presentes`
                : 'Nenhuma rota em andamento. Inicie uma rota para registrar presenças por voz.'}
            </Text>
          </View>
        </View>

        <FlatList
          ref={listaRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={renderMensagem}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <View style={styles.vazioIcone}>
                <Ionicons name="mic" size={30} color={colors.primary} />
              </View>
              <Text style={styles.vazioTitulo}>Fale ou digite o que precisa</Text>
              <Text style={styles.vazioTexto}>
                Toque no microfone e diga, por exemplo, quem entrou na van ou pergunte sobre o seu
                financeiro.
              </Text>
              <View style={styles.sugestoes}>
                {sugestoes.map((sugestao) => (
                  <TouchableOpacity
                    key={sugestao}
                    style={styles.sugestao}
                    onPress={() => enviar(sugestao, 'texto')}
                  >
                    <Text style={styles.sugestaoTexto}>{sugestao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {usandoMockIA() ? (
                <Text style={styles.aviso}>Modo demonstração: as respostas são simuladas no app.</Text>
              ) : null}
            </View>
          }
          ListFooterComponent={
            carregando ? (
              <View style={styles.linha}>
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <View style={[styles.balao, styles.balaoIA, styles.pensando]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.pensandoTexto}>Pensando…</Text>
                </View>
              </View>
            ) : null
          }
        />

        {voz.ouvindo ? (
          <View style={styles.ouvindo}>
            <View style={styles.ouvindoPonto} />
            <Text style={styles.ouvindoTexto} numberOfLines={3}>
              {voz.textoParcial || 'Ouvindo… pode falar'}
            </Text>
          </View>
        ) : null}
        {voz.erro && !voz.ouvindo ? <Text style={styles.erroVoz}>{voz.erro}</Text> : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder={voz.ouvindo ? 'Ouvindo…' : 'Digite uma mensagem'}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!voz.ouvindo}
          />
          <TouchableOpacity
            style={[
              styles.botao,
              voz.ouvindo && styles.botaoOuvindo,
              ocupado && styles.botaoDesabilitado,
            ]}
            onPress={temTexto ? () => enviar(texto, 'texto') : alternarMicrofone}
            disabled={ocupado}
            accessibilityLabel={temTexto ? 'Enviar' : voz.ouvindo ? 'Parar de ouvir' : 'Falar'}
          >
            <Ionicons
              name={temTexto ? 'send' : voz.ouvindo ? 'stop' : 'mic'}
              size={temTexto ? 20 : 24}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  topo: { paddingHorizontal: 20, paddingTop: 8 },
  novaConversa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  novaConversaTexto: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  rota: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: -6,
    marginBottom: 8,
  },
  rotaAtiva: { backgroundColor: '#F4FBF4', borderColor: colors.successBg },
  rotaTexto: { flex: 1, fontSize: 13, color: colors.textSecondary },
  lista: { paddingHorizontal: 20, paddingVertical: 12, flexGrow: 1 },
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  linhaMotorista: { justifyContent: 'flex-end' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balao: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  balaoMotorista: { backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  balaoIA: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  balaoErro: { backgroundColor: colors.errorBg, borderColor: colors.errorBg },
  origem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  origemTexto: { fontSize: 10, fontWeight: '700', color: colors.primarySoft },
  textoBalao: { fontSize: 15, lineHeight: 21, color: colors.text },
  textoMotorista: { color: colors.white },
  acoes: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  acoesLista: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  acaoPresente: { backgroundColor: colors.successBg },
  acaoAusente: { backgroundColor: colors.errorBg },
  acaoDesfeita: { opacity: 0.45 },
  acaoTexto: { fontSize: 12, fontWeight: '600', color: colors.text },
  desfazer: { fontSize: 13, fontWeight: '700', color: colors.primary },
  desfeito: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  pensando: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pensandoTexto: { fontSize: 14, color: colors.textSecondary },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  vazioIcone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  vazioTitulo: { fontSize: 17, fontWeight: '700', color: colors.text },
  vazioTexto: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  sugestoes: { marginTop: 18, gap: 8, alignSelf: 'stretch' },
  sugestao: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sugestaoTexto: { fontSize: 14, color: colors.text, textAlign: 'center' },
  aviso: { marginTop: 16, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  ouvindo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ouvindoPonto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },
  ouvindoTexto: { flex: 1, fontSize: 14, color: colors.text },
  erroVoz: { marginHorizontal: 20, marginBottom: 8, fontSize: 13, color: colors.error },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 15,
    color: colors.text,
  },
  botao: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoOuvindo: { backgroundColor: colors.error },
  botaoDesabilitado: { opacity: 0.5 },
});
