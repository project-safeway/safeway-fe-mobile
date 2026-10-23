import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../../components/Button';
import { colors } from '../../../../constants/colors';
import {
  mockItinerarios,
  mockAlunosDetalhe,
  mockEscolasComAlunos,
  mockRotas,
} from '../../../../data/mock';
import { buildTrajeto } from '../../../../utils/trajeto';
import { buscarCaminhoPelasRuas } from '../../../../services/rotas';
import { useChamada } from '../../../../contexts/ChamadaContext';

const SAO_PAULO = { latitude: -23.5613, longitude: -46.6565, latitudeDelta: 0.06, longitudeDelta: 0.06 };

function enderecoDaParada(parada) {
  if (parada.tipo === 'aluno') {
    return mockAlunosDetalhe[parada.id]?.responsaveis?.[0]?.endereco;
  }
  return mockEscolasComAlunos.find((item) => item.escola.id === parada.id)?.escola.endereco;
}

function coordenada(endereco) {
  const latitude = parseFloat(endereco?.latitude);
  const longitude = parseFloat(endereco?.longitude);
  if (isNaN(latitude) || isNaN(longitude)) return null;
  return { latitude, longitude };
}

export default function RotaScreen() {
  const { id } = useLocalSearchParams();
  const mapRef = useRef(null);
  const itinerario = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );
  const [localizacaoPermitida, setLocalizacaoPermitida] = useState(false);
  const [caminho, setCaminho] = useState(null);

  const paradas = useMemo(
    () =>
      buildTrajeto(itinerario).map((parada) => {
        const endereco = enderecoDaParada(parada);
        return {
          ...parada,
          endereco: endereco ? `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}` : null,
          coordenada: coordenada(endereco),
        };
      }),
    [itinerario]
  );
  const pontosMapa = useMemo(() => paradas.filter((p) => p.coordenada), [paradas]);

  const resumo = caminho
    ? { distanciaTotal: caminho.distanciaMetros, tempoTotal: caminho.duracaoSegundos }
    : mockRotas[itinerario.id];

  useEffect(() => {
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

  const { chamada, iniciarChamada, marcarPresenca, encerrarChamada } = useChamada();

  useEffect(() => {
    iniciarChamada(itinerario);
  }, [itinerario, iniciarChamada]);

  const presencas = chamada?.itinerarioId === itinerario.id ? chamada.presencas : {};
  const totalAlunos = paradas.filter((p) => p.tipo === 'aluno').length;
  const totalPresentes = Object.values(presencas).filter(Boolean).length;

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

  const finalizar = () => {
    const payload = Object.fromEntries(
      Object.entries(presencas).map(([alunoId, presente]) => [alunoId, presente ? 'PRESENTE' : 'AUSENTE'])
    );
    Alert.alert(
      'Finalizar rota',
      `Presentes: ${totalPresentes} | Ausentes: ${totalAlunos - totalPresentes}\n\nDeseja finalizar a chamada?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Sim, finalizar',
          onPress: () => {
            console.log('[mock] registrarPresenca', payload, '→ FINALIZADA');
            encerrarChamada();
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
        onPress: () => {
          console.log('[mock] alterarStatusChamada → CANCELADA');
          encerrarChamada();
          router.back();
        },
      },
    ]);
  };

  const renderParada = ({ item, index }) => {
    const isEscola = item.tipo === 'escola';
    const presente = Boolean(presencas[item.id]);
    return (
      <View style={[styles.parada, isEscola && styles.paradaEscola]}>
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
        {isEscola ? null : (
          <View style={styles.presenca}>
            <Text style={[styles.presencaLabel, presente ? styles.presente : styles.ausente]}>
              {presente ? 'Presente' : 'Ausente'}
            </Text>
            <Switch
              value={presente}
              onValueChange={(v) => marcarPresenca(item.id, v)}
              trackColor={{ false: colors.border, true: colors.successAlt }}
              thumbColor={colors.white}
              accessibilityLabel={`Presença de ${item.nome}`}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.mapWrap}>
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
                  {totalPresentes}/{totalAlunos}
                </Text>
                <Text style={styles.resumoLabel}>Presentes</Text>
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
        <Button title="Cancelar" variant="outline" onPress={cancelar} style={styles.footerBtn} />
        <Button title="Finalizar Rota" onPress={finalizar} style={styles.footerBtn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  mapWrap: { height: 260, backgroundColor: '#E8F1F8' },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
  },
  paradaEscola: { backgroundColor: '#F4FBF4' },
  separator: { height: 8 },
  ordem: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ordemAluno: { backgroundColor: colors.primary },
  ordemEscola: { backgroundColor: colors.success },
  ordemText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  paradaInfo: { flex: 1 },
  paradaNome: { fontSize: 14, fontWeight: '700', color: colors.text },
  paradaNomeEscola: { color: colors.success },
  paradaMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  presenca: { alignItems: 'center' },
  presencaLabel: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  presente: { color: colors.success },
  ausente: { color: colors.textMuted },
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
