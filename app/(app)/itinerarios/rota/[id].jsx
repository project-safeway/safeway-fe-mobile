import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components/Button';
import { colors } from '../../../../constants/colors';
import { mockAlunosDetalhe, mockEscolasComAlunos, mockRotas } from '../../../../data/mock';
import { buildTrajeto } from '../../../../utils/trajeto';
import { STATUS_PRESENCA_INFO } from '../../../../utils/presenca';
import { buscarCaminhoPelasRuas } from '../../../../services/rotas';
import { usandoMockCore } from '../../../../services/api';
import { buscarItinerario, buscarLocalizacoesDosAlunos } from '../../../../services/chamada';
import { contarPresencas, useChamada } from '../../../../contexts/ChamadaContext';

const SAO_PAULO = { latitude: -23.5613, longitude: -46.6565, latitudeDelta: 0.06, longitudeDelta: 0.06 };
const OPCOES_STATUS = ['PRESENTE', 'AUSENTE', 'ENTREGUE'];
// Sem GOOGLE_MAPS_API_KEY no build, o mapa nativo do Android quebra ao inserir os marcadores.
const MAPA_DISPONIVEL = Boolean(Constants.expoConfig?.extra?.googleMaps?.apiKey);

const formatarEndereco = (e) => (e ? `${e.logradouro}, ${e.numero} - ${e.bairro}` : null);

function coordenada(origem) {
  const latitude = parseFloat(origem?.latitude);
  const longitude = parseFloat(origem?.longitude);
  if (isNaN(latitude) || isNaN(longitude)) return null;
  return { latitude, longitude };
}

/** Endereço e coordenada de cada parada: dos mocks, ou de GET /itinerarios/{id}/alunos com a core-api. */
function localDaParada(parada, localizacoes) {
  if (localizacoes) {
    const local = parada.tipo === 'aluno' ? localizacoes[String(parada.id)] : null;
    return { endereco: local?.enderecoCompleto ?? null, coordenada: coordenada(local) };
  }
  const endereco =
    parada.tipo === 'aluno'
      ? mockAlunosDetalhe[parada.id]?.responsaveis?.[0]?.endereco
      : mockEscolasComAlunos.find((item) => item.escola.id === parada.id)?.escola.endereco;
  return { endereco: formatarEndereco(endereco), coordenada: coordenada(endereco) };
}

export default function RotaScreen() {
  const { id } = useLocalSearchParams();
  const mapRef = useRef(null);
  const [itinerario, setItinerario] = useState(null);
  const [localizacoes, setLocalizacoes] = useState(null);
  const [erroCarregar, setErroCarregar] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [localizacaoPermitida, setLocalizacaoPermitida] = useState(false);
  const [caminho, setCaminho] = useState(null);
  const [encerrando, setEncerrando] = useState(false);
  const { chamada, iniciarChamada, marcarPresenca, encerrarChamada } = useChamada();

  useEffect(() => {
    let ativo = true;
    setErroCarregar(null);
    (async () => {
      try {
        const encontrado = await buscarItinerario(id);
        const locais = usandoMockCore()
          ? null
          : await buscarLocalizacoesDosAlunos(encontrado.id).catch((error) => {
              console.warn('[rota] localizações dos alunos indisponíveis:', error.message);
              return [];
            });
        await iniciarChamada(encontrado);
        if (!ativo) return;
        setLocalizacoes(locais && Object.fromEntries(locais.map((l) => [String(l.alunoId), l])));
        setItinerario(encontrado);
      } catch (error) {
        if (ativo) setErroCarregar(error.message);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [id, iniciarChamada, tentativa]);

  const paradas = useMemo(
    () => (itinerario ? buildTrajeto(itinerario).map((p) => ({ ...p, ...localDaParada(p, localizacoes) })) : []),
    [itinerario, localizacoes]
  );
  const pontosMapa = useMemo(() => paradas.filter((p) => p.coordenada), [paradas]);

  const resumo = caminho
    ? { distanciaTotal: caminho.distanciaMetros, tempoTotal: caminho.duracaoSegundos }
    : itinerario && mockRotas[itinerario.id];

  useEffect(() => {
    if (!pontosMapa.length) return undefined;
    let ativo = true;

    (async () => {
      let origem = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const permitido = status === 'granted';
        if (ativo) setLocalizacaoPermitida(permitido);
        if (permitido) {
          const posicao =
            (await Location.getLastKnownPositionAsync()) ??
            (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
          if (posicao) origem = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
        }
      } catch (error) {
        console.warn('[rota] localização indisponível:', error.message);
      }

      const pontos = pontosMapa.map((p) => p.coordenada);
      if (origem) pontos.unshift(origem);
      if (pontos.length < 2) return;

      try {
        const resultado = await buscarCaminhoPelasRuas(pontos);
        if (ativo) setCaminho(resultado);
      } catch (error) {
        console.warn('[rota] caminho pelas ruas indisponível:', error.message);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [pontosMapa]);

  const chamadaDaTela = itinerario && chamada && String(chamada.itinerarioId) === String(itinerario.id);
  const presencas = chamadaDaTela ? chamada.presencas : {};
  const contagem = contarPresencas(presencas);

  const linhaRota = caminho?.coordenadas ?? pontosMapa.map((p) => p.coordenada);

  const enquadrarMapa = (animated = false) => {
    if (linhaRota.length < 2) return;
    mapRef.current?.fitToCoordinates(linhaRota, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated,
    });
  };

  useEffect(() => {
    if (caminho) enquadrarMapa(true);
  }, [caminho]);

  const alterarPresenca = async (aluno, status) => {
    try {
      await marcarPresenca(aluno.id, status);
    } catch (error) {
      Alert.alert('Presença não registrada', `Não consegui salvar a presença de ${aluno.nome}: ${error.message}`);
    }
  };

  const encerrar = async (status) => {
    setEncerrando(true);
    try {
      await encerrarChamada(status);
      return true;
    } catch (error) {
      Alert.alert('Não foi possível encerrar a chamada', error.message);
      return false;
    } finally {
      setEncerrando(false);
    }
  };

  const finalizar = () => {
    Alert.alert(
      'Finalizar rota',
      `Presentes: ${contagem.aBordo} | Entregues: ${contagem.entregues} | Ausentes: ${contagem.ausentes}\n\nDeseja finalizar a chamada?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, finalizar',
          onPress: async () => {
            if (!(await encerrar('FINALIZADA'))) return;
            Alert.alert('Chamada finalizada', 'Presenças registradas com sucesso!', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const cancelar = () => {
    Alert.alert('Cancelar chamada', 'Tem certeza? Todos os registros serão perdidos.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          if (await encerrar('CANCELADA')) router.back();
        },
      },
    ]);
  };

  const renderParada = ({ item, index }) => {
    const isEscola = item.tipo === 'escola';
    const statusAtual = presencas[item.id] ?? 'AUSENTE';
    return (
      <View style={[styles.parada, isEscola && styles.paradaEscola]}>
        <View style={styles.paradaTopo}>
          <View style={[styles.ordem, isEscola ? styles.ordemEscola : styles.ordemAluno]}>
            {isEscola ? (
              <Ionicons name="school" size={16} color={colors.white} />
            ) : (
              <Text style={styles.ordemText}>{index + 1}</Text>
            )}
          </View>
          <View style={styles.paradaInfo}>
            <Text style={[styles.paradaNome, isEscola && styles.paradaNomeEscola]} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.paradaMeta} numberOfLines={1}>
              {isEscola ? item.endereco || item.cidade : item.escola}
            </Text>
          </View>
        </View>
        {isEscola ? null : (
          <View style={styles.statusLinha} accessibilityRole="radiogroup">
            {OPCOES_STATUS.map((status) => {
              const info = STATUS_PRESENCA_INFO[status];
              const ativo = statusAtual === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusBtn, ativo && { backgroundColor: info.fundo, borderColor: info.cor }]}
                  onPress={() => !ativo && alterarPresenca(item, status)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={`${info.rotulo}: ${item.nome}`}
                >
                  <Ionicons name={info.icone} size={14} color={ativo ? info.cor : colors.textMuted} />
                  <Text style={[styles.statusTexto, ativo && { color: info.cor }]}>{info.rotulo}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (!itinerario) {
    return (
      <SafeAreaView style={[styles.safe, styles.centro]} edges={['top', 'bottom']}>
        {erroCarregar ? (
          <>
            <Text style={styles.erroTexto}>Não foi possível iniciar a rota: {erroCarregar}</Text>
            <Button title="Tentar de novo" onPress={() => setTentativa((t) => t + 1)} style={styles.erroBtn} />
            <Button title="Voltar" variant="outline" onPress={() => router.back()} style={styles.erroBtn} />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.carregandoTexto}>Iniciando a chamada…</Text>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.mapWrap}>
        {MAPA_DISPONIVEL ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={pontosMapa[0] ? { ...SAO_PAULO, ...pontosMapa[0].coordenada } : SAO_PAULO}
            onMapReady={() => enquadrarMapa()}
            toolbarEnabled={false}
            showsUserLocation={localizacaoPermitida}
            showsMyLocationButton={localizacaoPermitida}
          >
            {linhaRota.length > 1 ? (
              <Polyline
                coordinates={linhaRota}
                strokeColor={colors.primary}
                strokeWidth={4}
                lineDashPattern={caminho ? undefined : [8, 6]}
              />
            ) : null}
            {pontosMapa.map((p) => {
              const isEscola = p.tipo === 'escola';
              return (
                <Marker key={p.key} coordinate={p.coordenada} title={p.nome} description={p.endereco}>
                  <View style={[styles.pin, isEscola ? styles.pinEscola : styles.pinAluno]}>
                    <Text style={styles.pinText}>{paradas.indexOf(p) + 1}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={styles.mapaIndisponivel}>
            <Ionicons name="map-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.mapaIndisponivelTexto}>Mapa indisponível neste build (sem chave do Google Maps).</Text>
          </View>
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={paradas}
        keyExtractor={(item) => item.key}
        renderItem={renderParada}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.title}>{itinerario.nome}</Text>
            <Text style={styles.subtitle}>
              {itinerario.horarioInicio} - {itinerario.horarioFim} •{' '}
              {itinerario.tipoViagem === 'SO_IDA' ? 'Ida' : 'Volta'}
            </Text>

            <View style={styles.resumo}>
              <View style={styles.resumoItem}>
                <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.resumoValue}>
                  {resumo ? `${(resumo.distanciaTotal / 1000).toFixed(2)} km` : '—'}
                </Text>
                <Text style={styles.resumoLabel}>Distância</Text>
              </View>
              <View style={styles.resumoDivider} />
              <View style={styles.resumoItem}>
                <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.resumoValue}>
                  {resumo ? `${Math.round(resumo.tempoTotal / 60)} min` : '—'}
                </Text>
                <Text style={styles.resumoLabel}>Duração</Text>
              </View>
              <View style={styles.resumoDivider} />
              <View style={styles.resumoItem}>
                <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.resumoValue}>
                  {contagem.aBordo}/{contagem.total}
                </Text>
                <Text style={styles.resumoLabel}>Na van</Text>
              </View>
              <View style={styles.resumoDivider} />
              <View style={styles.resumoItem}>
                <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.resumoValue}>{contagem.entregues}</Text>
                <Text style={styles.resumoLabel}>Entregues</Text>
              </View>
            </View>

            <View style={styles.legenda}>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendaText}>Aluno</Text>
              </View>
              <View style={styles.legendaItem}>
                <View style={[styles.legendaDot, { backgroundColor: colors.success }]} />
                <Text style={styles.legendaText}>Escola</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Este itinerário não possui alunos ou escolas cadastradas.</Text>
        }
      />

      <View style={styles.footer}>
        <Button
          title="Cancelar"
          variant="outline"
          onPress={cancelar}
          disabled={encerrando}
          style={styles.footerBtn}
        />
        <Button title="Finalizar Rota" onPress={finalizar} loading={encerrando} style={styles.footerBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centro: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  carregandoTexto: { fontSize: 14, color: colors.textSecondary },
  erroTexto: { fontSize: 14, color: colors.error, textAlign: 'center' },
  erroBtn: { alignSelf: 'stretch', borderRadius: 14 },
  mapWrap: { height: 260, backgroundColor: colors.infoBg },
  mapaIndisponivel: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  mapaIndisponivelTexto: { color: colors.textSecondary, textAlign: 'center' },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  pinAluno: { backgroundColor: colors.primary },
  pinEscola: { backgroundColor: colors.success },
  pinText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 16 },
  listHeader: { paddingTop: 16, marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 2, fontSize: 13, color: colors.textSecondary },
  resumo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    marginTop: 14,
  },
  resumoItem: { flex: 1, alignItems: 'center', gap: 2 },
  resumoValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  resumoLabel: { fontSize: 11, color: colors.textMuted },
  resumoDivider: { width: 1, height: 36, backgroundColor: colors.borderLight },
  legenda: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaDot: { width: 10, height: 10, borderRadius: 5 },
  legendaText: { fontSize: 12, color: colors.textSecondary },
  parada: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    gap: 10,
  },
  paradaTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paradaEscola: { backgroundColor: colors.successSoft },
  separator: { height: 8 },
  ordem: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ordemAluno: { backgroundColor: colors.primary },
  ordemEscola: { backgroundColor: colors.success },
  ordemText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  paradaInfo: { flex: 1 },
  paradaNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  paradaNomeEscola: { color: colors.success },
  paradaMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  statusLinha: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundAlt,
  },
  statusTexto: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerBtn: { flex: 1, borderRadius: 14 },
});
