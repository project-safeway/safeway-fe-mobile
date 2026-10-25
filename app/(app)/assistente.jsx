import { useEffect, useMemo, useRef, useState } from 'react';
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
  Linking,
  Alert,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { CartaoMensagem } from '../../components/assistente/CartaoMensagem';
import { CartaoPostos } from '../../components/assistente/CartaoPostos';
import { colors } from '../../constants/colors';
import { contarPresencas, useChamada } from '../../contexts/ChamadaContext';
import { useFinanceiro } from '../../contexts/FinanceiroContext';
import { useTranscricao } from '../../hooks/useTranscricao';
import { useLeituraEmVoz } from '../../hooks/useLeituraEmVoz';
import { enviarMensagem, usandoMockIA } from '../../services/ia';
import {
  obterLocalizacaoRapida,
  pedirPermissaoLocalizacao,
  statusPermissaoLocalizacao,
} from '../../services/localizacao';
import { obterSessao } from '../../services/sessao';
import { interpretarConfirmacao, montarLinkWhatsApp } from '../../utils/mensagens';
import { infoPresenca } from '../../utils/presenca';

let proximoId = 1;
const novoId = () => String(proximoId++);
const novaMensagem = (dados) => ({ id: novoId(), ...dados });
const primeiroNome = (nome) => String(nome || '').split(' ')[0];

/** Rascunhos ainda não abertos nem descartados, na ordem em que chegaram. */
const rascunhosPendentes = (mensagens) =>
  mensagens.flatMap((m) =>
    (m.rascunhos || []).filter((r) => r.status === 'pendente').map((r) => ({ mensagemId: m.id, rascunho: r }))
  );

export default function AssistenteScreen() {
  const { chamada, marcarPresenca } = useChamada();
  const { mensalidades, pagamentos } = useFinanceiro();
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [permissaoLocal, setPermissaoLocal] = useState('granted');
  const [avisoLocalFechado, setAvisoLocalFechado] = useState(false);
  const [filaEnvio, setFilaEnvio] = useState([]);
  const [voltouDoWhatsApp, setVoltouDoWhatsApp] = useState(false);
  const conversaIdRef = useRef(null);
  const listaRef = useRef(null);
  const mensagensRef = useRef(mensagens);
  mensagensRef.current = mensagens;
  const contextoRef = useRef(null);
  contextoRef.current = {
    chamada,
    mensalidades,
    pagamentos,
    nomeMotorista: obterSessao()?.nomeUsuario,
  };

  const leitura = useLeituraEmVoz();

  useEffect(() => {
    statusPermissaoLocalizacao().then(setPermissaoLocal);
  }, []);

  useEffect(() => {
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') setVoltouDoWhatsApp(true);
    });
    return () => assinatura.remove();
  }, []);

  const palavrasEsperadas = useMemo(
    () => (chamada?.alunos || []).flatMap((a) => [a.nome, primeiroNome(a.nome)]),
    [chamada?.alunos]
  );

  const contagem = chamada ? contarPresencas(chamada.presencas) : null;
  const pendentes = rascunhosPendentes(mensagens);
  const pendentesIds = new Set(pendentes.map((p) => p.rascunho.id));
  const proximoDaFila = voltouDoWhatsApp ? filaEnvio.find((id) => pendentesIds.has(id)) : null;
  const restantesNaFila = filaEnvio.filter((id) => pendentesIds.has(id)).length;

  const adicionar = (...novas) => setMensagens((prev) => [...prev, ...novas]);

  const responderLocal = (resposta) => {
    adicionar(novaMensagem({ autor: 'ia', texto: resposta, local: true }));
    leitura.falar(resposta);
  };

  const atualizarRascunho = (mensagemId, rascunhoId, dados) =>
    setMensagens((prev) =>
      prev.map((m) =>
        m.id === mensagemId
          ? { ...m, rascunhos: m.rascunhos.map((r) => (r.id === rascunhoId ? { ...r, ...dados } : r)) }
          : m
      )
    );

  /** Abre o WhatsApp com o texto pronto. O envio de fato é o motorista quem faz, lá dentro. */
  const abrirWhatsApp = async (mensagemId, rascunho) => {
    const link = montarLinkWhatsApp(rascunho.acao.telefone, rascunho.mensagem);
    if (!link) {
      Alert.alert('Telefone inválido', `O telefone de ${rascunho.acao.responsavelNome} não é válido.`);
      return false;
    }
    try {
      setVoltouDoWhatsApp(false);
      await Linking.openURL(link);
      atualizarRascunho(mensagemId, rascunho.id, { status: 'aberto' });
      return true;
    } catch {
      Alert.alert('WhatsApp indisponível', 'Não consegui abrir o WhatsApp neste celular.');
      return false;
    }
  };

  /** Abre o próximo rascunho pendente e deixa os demais na fila (um por vez). */
  const enviarProximo = async (lista = rascunhosPendentes(mensagensRef.current)) => {
    const [primeiro, ...resto] = lista;
    if (!primeiro) return;
    setFilaEnvio(resto.map((p) => p.rascunho.id));
    await abrirWhatsApp(primeiro.mensagemId, primeiro.rascunho);
  };

  const enviarTodas = (mensagemId) =>
    enviarProximo(rascunhosPendentes(mensagensRef.current).filter((p) => p.mensagemId === mensagemId));

  const abrirProximoDaFila = () => {
    const lista = rascunhosPendentes(mensagensRef.current);
    enviarProximo(filaEnvio.map((id) => lista.find((p) => p.rascunho.id === id)).filter(Boolean));
  };

  const descartarPendentes = () => {
    const ids = new Set(rascunhosPendentes(mensagensRef.current).map((p) => p.rascunho.id));
    setMensagens((prev) =>
      prev.map((m) =>
        m.rascunhos
          ? { ...m, rascunhos: m.rascunhos.map((r) => (ids.has(r.id) ? { ...r, status: 'descartado' } : r)) }
          : m
      )
    );
    setFilaEnvio([]);
    return ids.size;
  };

  /** "pode mandar" / "cancela" logo depois de um rascunho: resolvido no app, sem ir para a IA. */
  const tratarConfirmacao = (falado) => {
    const lista = rascunhosPendentes(mensagensRef.current);
    if (!lista.length) return false;
    const decisao = interpretarConfirmacao(falado);
    if (!decisao) return false;

    if (decisao === 'DESCARTAR') {
      const total = descartarPendentes();
      responderLocal(total === 1 ? 'Ok, descartei a mensagem.' : `Ok, descartei ${total} mensagens.`);
      return true;
    }
    const [{ rascunho }] = lista;
    const restantes = lista.length - 1;
    responderLocal(
      `Abrindo o WhatsApp para ${primeiroNome(rascunho.acao.responsavelNome)}. Confira e toque em enviar lá.` +
        (restantes ? ` Depois volte aqui para a próxima (${restantes === 1 ? 'falta 1' : `faltam ${restantes}`}).` : '')
    );
    setTimeout(() => enviarProximo(lista), 1200);
    return true;
  };

  /** A API já gravou na core-api; aqui só refletimos na chamada aberta, guardando o status anterior para desfazer. */
  const aplicarPresencas = (acoes) => {
    const chamadaAtual = contextoRef.current.chamada;
    if (!chamadaAtual) return [];
    return acoes
      .filter((a) => a.tipo === 'MARCAR_PRESENCA' && a.alunoId in chamadaAtual.presencas)
      .map((a) => {
        const anterior = chamadaAtual.presencas[a.alunoId];
        marcarPresenca(a.alunoId, a.status, { sincronizar: false });
        return { ...a, anterior };
      });
  };

  const enviar = async (conteudo, origem) => {
    const limpo = conteudo.trim();
    if (!limpo || carregando) return;
    setTexto('');
    adicionar(novaMensagem({ autor: 'motorista', texto: limpo, origem }));
    if (tratarConfirmacao(limpo)) return;
    setCarregando(true);

    const itinerarioId = contextoRef.current.chamada?.itinerarioId ?? null;
    try {
      const localizacao = await obterLocalizacaoRapida();
      const resposta = await enviarMensagem(
        { conversaId: conversaIdRef.current, texto: limpo, itinerarioId, localizacao },
        contextoRef.current
      );
      conversaIdRef.current = resposta.conversaId;
      const presencas = aplicarPresencas(resposta.acoes);
      const rascunhos = resposta.acoes
        .filter((a) => a.tipo === 'ENVIAR_MENSAGEM_RESPONSAVEL')
        .map((acao) => ({ id: novoId(), acao, mensagem: acao.mensagem || '', status: 'pendente' }));
      const postos = resposta.acoes.filter((a) => a.tipo === 'SUGERIR_POSTOS');
      adicionar(
        novaMensagem({ autor: 'ia', texto: resposta.resposta, acoes: presencas, rascunhos, postos, itinerarioId })
      );
      leitura.falar(resposta.resposta);
    } catch (error) {
      console.warn('[ia]', error.message);
      const textoErro =
        error.status === 401
          ? 'Sua sessão expirou. Entre novamente para usar o assistente.'
          : 'Não consegui falar com o assistente agora. Tente de novo em instantes.';
      adicionar(novaMensagem({ autor: 'ia', texto: textoErro, erro: true }));
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
    if (voz.ouvindo) {
      voz.parar();
      return;
    }
    leitura.parar();
    voz.iniciar();
  };

  const desfazer = async (mensagem) => {
    try {
      await Promise.all(mensagem.acoes.map((a) => marcarPresenca(a.alunoId, a.anterior)));
      setMensagens((prev) => prev.map((m) => (m.id === mensagem.id ? { ...m, desfeito: true } : m)));
    } catch (error) {
      Alert.alert('Não foi possível desfazer', error.message);
    }
  };

  const permitirLocalizacao = async () => {
    setPermissaoLocal(await pedirPermissaoLocalizacao());
    setAvisoLocalFechado(true);
  };

  const novaConversa = () => {
    voz.parar();
    leitura.parar();
    conversaIdRef.current = null;
    setMensagens([]);
    setFilaEnvio([]);
    setTexto('');
  };

  const sugestoes = chamada
    ? [
        ...(chamada.alunos[0] ? [`${primeiroNome(chamada.alunos[0].nome)} entrou na van`] : []),
        'Tô parado no trânsito',
        'Onde tem gasolina mais barata?',
      ]
    : ['Como está meu financeiro este mês?', 'Onde tem gasolina mais barata?', 'Quem ainda não pagou?'];

  const temTexto = texto.trim().length > 0;
  const ocupado = carregando && !voz.ouvindo;

  const renderPresencas = (item) => {
    const podeDesfazer = !item.desfeito && chamada?.itinerarioId === item.itinerarioId;
    return (
      <View style={styles.acoes}>
        <View style={styles.acoesLista}>
          {item.acoes.map((acao) => {
            const info = infoPresenca(acao.status);
            return (
              <View
                key={acao.alunoId}
                style={[styles.acao, { backgroundColor: info.fundo }, item.desfeito && styles.acaoDesfeita]}
              >
                <Ionicons name={info.icone} size={14} color={info.cor} />
                <Text style={styles.acaoTexto}>
                  {primeiroNome(acao.nomeAluno)} · {info.rotulo}
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
    );
  };

  const renderRascunhos = (item) => {
    const pendentesDaMensagem = item.rascunhos.filter((r) => r.status === 'pendente').length;
    return (
      <View style={styles.cartoes}>
        {item.rascunhos.map((rascunho) => (
          <CartaoMensagem
            key={rascunho.id}
            rascunho={rascunho}
            onEnviar={() => {
              setFilaEnvio([]);
              abrirWhatsApp(item.id, rascunho);
            }}
            onSalvarEdicao={(mensagem) => atualizarRascunho(item.id, rascunho.id, { mensagem })}
            onDescartar={() => atualizarRascunho(item.id, rascunho.id, { status: 'descartado' })}
          />
        ))}
        {pendentesDaMensagem > 1 ? (
          <TouchableOpacity style={styles.enviarTodas} onPress={() => enviarTodas(item.id)}>
            <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
            <Text style={styles.enviarTodasTexto}>Enviar todas ({pendentesDaMensagem}), uma por vez</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.avisoEnvio}>
          Nada é enviado automaticamente: o WhatsApp abre com o texto pronto e você confirma o envio lá.
        </Text>
      </View>
    );
  };

  const renderMensagem = ({ item }) => {
    const doMotorista = item.autor === 'motorista';
    const temCartoes = item.rascunhos?.length || item.postos?.length;

    return (
      <View style={styles.bloco}>
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
            {item.acoes?.length ? renderPresencas(item) : null}
          </View>
        </View>
        {temCartoes ? (
          <View style={styles.cartoesRecuo}>
            {item.rascunhos?.length ? renderRascunhos(item) : null}
            {item.postos?.map((acao, indice) => <CartaoPostos key={indice} acao={acao} />)}
          </View>
        ) : null}
      </View>
    );
  };

  const mostrarAvisoLocal = permissaoLocal === 'undetermined' && !avisoLocalFechado;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.topo}>
          <ScreenHeader
            eyebrow="Assistente SafeWay"
            title="Fale com a IA"
            right={
              <View style={styles.topoAcoes}>
                {leitura.disponivel ? (
                  <TouchableOpacity
                    style={styles.botaoTopo}
                    onPress={leitura.alternarSilencio}
                    accessibilityLabel={leitura.silenciado ? 'Ativar leitura em voz alta' : 'Silenciar leitura em voz alta'}
                  >
                    <Ionicons
                      name={leitura.silenciado ? 'volume-mute' : 'volume-high'}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                ) : null}
                {mensagens.length ? (
                  <TouchableOpacity style={styles.novaConversa} onPress={novaConversa} accessibilityLabel="Nova conversa">
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Text style={styles.novaConversaTexto}>Nova</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
                ? `${chamada.nomeItinerario} em andamento · ${contagem.aBordo}/${contagem.total} na van` +
                  (contagem.entregues ? ` · ${contagem.entregues} entregues` : '')
                : 'Nenhuma rota em andamento. Inicie uma rota para registrar presenças por voz.'}
            </Text>
          </View>
          {mostrarAvisoLocal ? (
            <View style={styles.avisoLocal}>
              <Ionicons name="location-outline" size={18} color={colors.info} />
              <View style={styles.flex}>
                <Text style={styles.avisoLocalTexto}>
                  Permita a localização para o assistente incluir onde você está nos avisos de atraso aos
                  responsáveis e encontrar postos perto de você. Ela só é usada quando você fala com o
                  assistente.
                </Text>
                <View style={styles.avisoLocalBotoes}>
                  <TouchableOpacity onPress={permitirLocalizacao} hitSlop={6}>
                    <Text style={styles.avisoLocalPermitir}>Permitir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setAvisoLocalFechado(true)} hitSlop={6}>
                    <Text style={styles.avisoLocalAgoraNao}>Agora não</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
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
                Toque no microfone e diga quem entrou na van ou foi entregue, avise que está no trânsito,
                procure um posto ou pergunte sobre o seu financeiro.
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

        {proximoDaFila ? (
          <View style={styles.fila}>
            <Ionicons name="logo-whatsapp" size={18} color={colors.whatsapp} />
            <Text style={styles.filaTexto} numberOfLines={2}>
              {restantesNaFila === 1 ? 'Falta 1 mensagem' : `Faltam ${restantesNaFila} mensagens`}. Diga "pode
              mandar" ou toque para abrir a próxima.
            </Text>
            <TouchableOpacity style={styles.filaAbrir} onPress={abrirProximoDaFila}>
              <Text style={styles.filaAbrirTexto}>Abrir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilaEnvio([])} hitSlop={8} accessibilityLabel="Parar envio">
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : null}

        {voz.ouvindo ? (
          <View style={styles.ouvindo}>
            <View style={styles.ouvindoPonto} />
            <Text style={styles.ouvindoTexto} numberOfLines={3}>
              {voz.textoParcial || (pendentes.length ? 'Ouvindo… diga "pode mandar" ou "cancela"' : 'Ouvindo… pode falar')}
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
  topoAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  botaoTopo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  rotaAtiva: { backgroundColor: colors.successSoft, borderColor: colors.successBg },
  rotaTexto: { flex: 1, fontSize: 13, color: colors.textSecondary },
  avisoLocal: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.infoBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  avisoLocalTexto: { fontSize: 13, lineHeight: 18, color: colors.text },
  avisoLocalBotoes: { flexDirection: 'row', gap: 20, marginTop: 8 },
  avisoLocalPermitir: { fontSize: 13, fontWeight: '700', color: colors.info },
  avisoLocalAgoraNao: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  lista: { paddingHorizontal: 20, paddingVertical: 12, flexGrow: 1 },
  bloco: { marginBottom: 12 },
  linha: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
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
  acaoDesfeita: { opacity: 0.45 },
  acaoTexto: { fontSize: 12, fontWeight: '600', color: colors.text },
  desfazer: { fontSize: 13, fontWeight: '700', color: colors.primary },
  desfeito: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
  cartoesRecuo: { marginTop: 8, marginLeft: 36, gap: 8 },
  cartoes: { gap: 8 },
  enviarTodas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.whatsapp,
  },
  enviarTodasTexto: { color: colors.white, fontWeight: '700', fontSize: 14 },
  avisoEnvio: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
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
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filaTexto: { flex: 1, fontSize: 13, color: colors.text },
  filaAbrir: {
    backgroundColor: colors.whatsapp,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filaAbrirTexto: { color: colors.white, fontWeight: '700', fontSize: 13 },
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
