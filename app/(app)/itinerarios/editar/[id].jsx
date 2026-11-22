import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../../components/Input';
import { Select } from '../../../../components/Select';
import { Button } from '../../../../components/Button';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../../components/EstadoCarregamento';
import { colors } from '../../../../constants/colors';
import { useCarregar } from '../../../../hooks/useCarregar';
import {
  atualizarItinerario,
  buscarItinerario,
  buscarParadas,
  otimizarRota,
} from '../../../../services/itinerarios';
import { listarAlunos } from '../../../../services/alunos';
import { listarEscolas } from '../../../../services/escolas';
import { obterLocalizacaoRapida } from '../../../../services/localizacao';
import { isRequired } from '../../../../utils/validators';
import { formatEndereco, horaCurta } from '../../../../utils/formatters';
import { HORARIO_OPTIONS, TIPO_VIAGEM_OPTIONS } from '../../../../utils/constants';
import { responsavelPrincipal } from '../../../../utils/alunoForm';
import { buildTrajeto, reindexTrajeto, toStops } from '../../../../utils/trajeto';
import {
  aplicarOrdemOtimizada,
  montarRequisicaoOtimizacao,
} from '../../../../utils/otimizacaoRota';

export default function EditarItinerarioScreen() {
  const { id } = useLocalSearchParams();
  const { dados, erro, recarregar } = useCarregar(async () => {
    const [itinerario, paradas, alunos, escolas] = await Promise.all([
      buscarItinerario(id),
      buscarParadas(id),
      listarAlunos(),
      listarEscolas(),
    ]);
    return { itinerario, paradas, alunos, escolas };
  }, [id]);

  if (!dados) {
    return (
      <KeyboardScreen>
        <BackHeader
          title="Editar Itinerário"
          subtitle="Altere as informações e gerencie o planejamento de rotas"
        />
        <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
      </KeyboardScreen>
    );
  }

  return <FormularioItinerario {...dados} />;
}

function FormularioItinerario({ itinerario, paradas, alunos, escolas }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef();

  const [nome, setNome] = useState(itinerario.name);
  const [horarioInicio, setHorarioInicio] = useState(horaCurta(itinerario.startTime));
  const [horarioFim, setHorarioFim] = useState(horaCurta(itinerario.endTime));
  const [tipoViagem, setTipoViagem] = useState(itinerario.routeType);
  const [trajeto, setTrajeto] = useState(() => buildTrajeto(paradas));
  const [resumoOtimizacao, setResumoOtimizacao] = useState(null);
  const [otimizando, setOtimizando] = useState(false);
  const [addModal, setAddModal] = useState(null);
  const [enderecoModalItem, setEnderecoModalItem] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const alunosPorId = useMemo(
    () => new Map(alunos.map((a) => [a.id, a])),
    [alunos]
  );

  const totalAlunos = trajeto.filter((t) => t.tipo === 'aluno').length;
  const totalEscolas = trajeto.length - totalAlunos;

  const opcoesAdicionar = useMemo(() => {
    const noTrajeto = new Set(trajeto.map((t) => t.key));
    if (addModal === 'aluno') {
      return alunos
        .filter((a) => !noTrajeto.has(`aluno-${a.id}`))
        .map((a) => {
          const principal = responsavelPrincipal(a.guardians);
          return {
            id: a.id,
            nome: a.name,
            escola: a.school?.name,
            sala: a.classroom,
            responsavel: principal?.name,
            address: principal?.address,
          };
        });
    }
    if (addModal === 'escola') {
      return escolas
        .filter((e) => !noTrajeto.has(`escola-${e.id}`))
        .map((e) => ({ id: e.id, nome: e.name, cidade: e.address?.city, address: e.address }));
    }
    return [];
  }, [addModal, trajeto, alunos, escolas]);

  const selecionarEnderecoParada = (paradaKey, guardian) => {
    setTrajeto((prev) =>
      prev.map((item) =>
        item.key === paradaKey
          ? { ...item, responsavel: guardian.name, address: guardian.address }
          : item
      )
    );
    setResumoOtimizacao(null);
    setEnderecoModalItem(null);
  };

  const adicionar = (option) => {
    setTrajeto((prev) =>
      reindexTrajeto([...prev, { ...option, key: `${addModal}-${option.id}`, tipo: addModal }])
    );
    setResumoOtimizacao(null);
    setAddModal(null);
  };

  const remover = useCallback((item) => {
    const isEscola = item.tipo === 'escola';
    Alert.alert(
      isEscola ? 'Remover escola' : 'Remover aluno',
      `Remover "${item.nome}" do itinerário?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setTrajeto((prev) => reindexTrajeto(prev.filter((t) => t.key !== item.key)));
            setResumoOtimizacao(null);
          },
        },
      ]
    );
  }, []);

  const otimizar = async () => {
    setOtimizando(true);
    try {
      const localizacaoAtual = await obterLocalizacaoRapida();
      const { payload, erro } = montarRequisicaoOtimizacao(trajeto, {
        tipoViagem,
        veiculoId: itinerario.id,
        localizacaoAtual,
      });
      if (erro) {
        Alert.alert('Não foi possível otimizar', erro);
        return;
      }
      const resposta = await otimizarRota(payload);
      const { trajetoOtimizado, distanciaMetros, duracaoSegundos } = aplicarOrdemOtimizada(
        trajeto,
        resposta
      );
      setTrajeto(trajetoOtimizado);
      setResumoOtimizacao({ distanciaMetros, duracaoSegundos });
    } catch (e) {
      Alert.alert('Não foi possível otimizar a rota', e.message);
    } finally {
      setOtimizando(false);
    }
  };

  const salvar = async () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome é obrigatório';
    if (!horarioInicio) next.horarioInicio = 'Horário de início é obrigatório';
    if (!horarioFim) next.horarioFim = 'Horário de fim é obrigatório';
    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
      next.horarioFim = 'Horário de fim deve ser maior que o início';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await atualizarItinerario(itinerario.id, {
        name: nome.trim(),
        startTime: `${horarioInicio}:00`,
        endTime: `${horarioFim}:00`,
        routeType: tipoViagem,
        active: itinerario.active ?? true,
        stops: toStops(trajeto),
      });
      Alert.alert('Itinerário atualizado', 'Alterações salvas com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Não foi possível salvar', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const isEscola = item.tipo === 'escola';
      const responsaveisAluno = isEscola
        ? []
        : (alunosPorId.get(item.id)?.guardians || []).filter((g) => g?.address?.id);
      const podeTrocarEndereco = responsaveisAluno.length > 1;
      const enderecoTexto = formatEndereco(item.address);

      return (
        <View style={[styles.stop, isEscola && styles.stopEscola]}>
          <Sortable.Handle>
            <View style={styles.handle} accessibilityLabel="Arrastar para reordenar">
              <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
            </View>
          </Sortable.Handle>

          <View style={[styles.ordem, isEscola ? styles.ordemEscola : styles.ordemAluno]}>
            <Text style={[styles.ordemText, isEscola ? styles.ordemTextEscola : styles.ordemTextAluno]}>
              {index + 1}º
            </Text>
          </View>

          <View style={styles.stopInfo}>
            <Text style={styles.stopName} numberOfLines={1}>
              {item.nome}
            </Text>
            {isEscola ? (
              <Text style={styles.stopMeta}>{item.cidade || '-'}</Text>
            ) : (
              <>
                <Text style={styles.stopMeta} numberOfLines={1}>
                  Escola: {item.escola || '-'}
                </Text>
                <Text style={styles.stopMeta} numberOfLines={1}>
                  Resp.: {item.responsavel || '-'}
                </Text>
                {enderecoTexto ? (
                  <Text style={styles.stopAddr} numberOfLines={1}>
                    {enderecoTexto}
                  </Text>
                ) : null}
                {podeTrocarEndereco ? (
                  <TouchableOpacity
                    style={styles.changeAddrBtn}
                    onPress={() => setEnderecoModalItem(item)}
                    hitSlop={6}
                  >
                    <Ionicons name="location-outline" size={13} color={colors.primaryDark} />
                    <Text style={styles.changeAddrText}>Trocar endereço ({responsaveisAluno.length})</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>

          <TouchableOpacity onPress={() => remover(item)} hitSlop={8} accessibilityLabel="Remover">
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    },
    [remover, alunosPorId]
  );

  return (
    <>
      <KeyboardScreen scrollRef={scrollRef}>
        <BackHeader
          title="Editar Itinerário"
          subtitle="Altere as informações e gerencie o planejamento de rotas"
        />

        <Card>
          <Text style={styles.cardTitle}>Informações do Itinerário</Text>
          <Input
            label="Nome do Itinerário *"
            placeholder="Ex: Rota Centro"
            value={nome}
            onChangeText={setNome}
            error={errors.nome}
          />
          <View style={styles.row}>
            <View style={styles.col}>
              <Select
                label="Horário Início *"
                value={horarioInicio}
                options={HORARIO_OPTIONS}
                onChange={setHorarioInicio}
                error={errors.horarioInicio}
              />
            </View>
            <View style={styles.col}>
              <Select
                label="Horário Fim *"
                value={horarioFim}
                options={HORARIO_OPTIONS}
                onChange={setHorarioFim}
                error={errors.horarioFim}
              />
            </View>
          </View>
          <Select
            label="Tipo de Viagem *"
            value={tipoViagem}
            options={TIPO_VIAGEM_OPTIONS}
            onChange={setTipoViagem}
          />
        </Card>

        <Card>
          <View style={styles.planHead}>
            <View style={styles.planIcon}>
              <Ionicons name="git-branch-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitleNoMargin}>Planejamento de Rotas</Text>
              <Text style={styles.planMeta}>
                {totalAlunos} aluno(s) • {totalEscolas} escola(s)
              </Text>
            </View>
          </View>

          <View style={styles.addRow}>
            <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal('aluno')}>
              <Ionicons name="person-add-outline" size={16} color={colors.white} />
              <Text style={styles.addBtnText}>Adicionar Aluno</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, styles.addBtnEscola]}
              onPress={() => setAddModal('escola')}
            >
              <Ionicons name="school-outline" size={16} color={colors.white} />
              <Text style={styles.addBtnText}>Adicionar Escola</Text>
            </TouchableOpacity>
          </View>

          {trajeto.length >= 2 ? (
            <TouchableOpacity
              style={[styles.optimizeBtn, otimizando && styles.optimizeBtnDisabled]}
              onPress={otimizar}
              disabled={otimizando || loading}
            >
              {otimizando ? (
                <ActivityIndicator size="small" color={colors.primaryDark} />
              ) : (
                <Ionicons name="sparkles-outline" size={16} color={colors.primaryDark} />
              )}
              <Text style={styles.optimizeBtnText}>
                {otimizando ? 'Otimizando rota…' : 'Otimizar ordem da rota'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {resumoOtimizacao ? (
            <View style={styles.optimizeInfo}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.optimizeInfoText}>
                Ordem otimizada
                {resumoOtimizacao.distanciaMetros !== null
                  ? ` · ${(resumoOtimizacao.distanciaMetros / 1000).toFixed(2)} km`
                  : ''}
                {resumoOtimizacao.duracaoSegundos !== null
                  ? ` · ${Math.round(resumoOtimizacao.duracaoSegundos / 60)} min`
                  : ''}
                . Revise e toque em Salvar Alterações.
              </Text>
            </View>
          ) : null}

          {trajeto.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="git-branch-outline" size={40} color={colors.border} />
              <Text style={styles.emptyTitle}>Nenhum item no trajeto</Text>
              <Text style={styles.emptyText}>Adicione alunos e escolas para planejar sua rota</Text>
            </View>
          ) : (
            <>
              <Text style={styles.dragHint}>Segure e arraste pelo ícone ☰ para reordenar</Text>
              <Sortable.Grid
                columns={1}
                data={trajeto}
                keyExtractor={(item) => item.key}
                renderItem={renderItem}
                rowGap={8}
                customHandle
                scrollableRef={scrollRef}
                onDragEnd={({ data }) => {
                  setTrajeto(reindexTrajeto(data));
                  setResumoOtimizacao(null);
                }}
              />
            </>
          )}
        </Card>

        <View style={styles.actions}>
          <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={styles.actionBtn} />
          <Button title="Salvar Alterações" onPress={salvar} loading={loading} style={styles.actionBtn} />
        </View>
      </KeyboardScreen>

      <Modal visible={!!addModal} transparent animationType="fade" onRequestClose={() => setAddModal(null)}>
        <Pressable style={styles.overlay} onPress={() => setAddModal(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>
              {addModal === 'aluno' ? 'Adicionar Aluno' : 'Adicionar Escola'}
            </Text>
            {opcoesAdicionar.length === 0 ? (
              <Text style={styles.emptyText}>
                {addModal === 'aluno'
                  ? 'Todos os alunos já estão no itinerário.'
                  : 'Todas as escolas já estão no itinerário.'}
              </Text>
            ) : (
              <FlatList
                data={opcoesAdicionar}
                keyExtractor={(item) => String(item.id)}
                style={styles.sheetList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.sheetOption} onPress={() => adicionar(item)}>
                    <Text style={styles.sheetOptionText}>{item.nome}</Text>
                    <Text style={styles.sheetOptionMeta}>{item.escola || item.cidade || ''}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <Button title="Fechar" variant="outline" onPress={() => setAddModal(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(enderecoModalItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setEnderecoModalItem(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setEnderecoModalItem(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>Escolher endereço na rota</Text>
            {enderecoModalItem ? (
              <>
                <Text style={styles.sheetSubtitle}>
                  Selecione qual endereço será usado para {enderecoModalItem.nome} neste itinerário:
                </Text>
                <FlatList
                  data={(alunosPorId.get(enderecoModalItem.id)?.guardians || []).filter((g) => g?.address?.id)}
                  keyExtractor={(g) => String(g.id)}
                  style={styles.sheetList}
                  renderItem={({ item: guardian }) => {
                    const selecionado = enderecoModalItem.address?.id === guardian.address?.id;
                    return (
                      <TouchableOpacity
                        style={[styles.addrOption, selecionado && styles.addrOptionAtivo]}
                        onPress={() => selecionarEnderecoParada(enderecoModalItem.key, guardian)}
                      >
                        <View style={styles.flex}>
                          <View style={styles.addrOptionHead}>
                            <Text style={styles.sheetOptionText}>{guardian.name}</Text>
                            {guardian.address?.principal ? (
                              <Text style={styles.addrPrincipalTag}>Principal</Text>
                            ) : null}
                          </View>
                          <Text style={styles.sheetOptionMeta}>{formatEndereco(guardian.address)}</Text>
                        </View>
                        {selecionado ? (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                />
              </>
            ) : null}
            <Button title="Fechar" variant="outline" onPress={() => setEnderecoModalItem(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  cardTitleNoMargin: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planMeta: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  addBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  addBtnEscola: { backgroundColor: colors.success },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  optimizeBtnDisabled: { opacity: 0.6 },
  optimizeBtnText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  optimizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.successBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  optimizeInfoText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.text },
  dragHint: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyTitle: { fontWeight: '700', color: colors.text },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginBottom: 12 },
  stop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingRight: 12,
  },
  stopEscola: { backgroundColor: '#F4FBF4' },
  handle: { paddingHorizontal: 8, paddingVertical: 6 },
  ordem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ordemAluno: { backgroundColor: colors.primarySoft },
  ordemEscola: { backgroundColor: colors.successBg },
  ordemText: { fontWeight: '700', fontSize: 13 },
  ordemTextAluno: { color: colors.primaryDark },
  ordemTextEscola: { color: colors.success },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '700', color: colors.text },
  stopMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  stopAddr: { marginTop: 2, fontSize: 11, color: colors.textSecondary },
  changeAddrBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  changeAddrText: { fontSize: 11, fontWeight: '700', color: colors.primaryDark },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, borderRadius: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sheetSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  sheetList: { marginBottom: 12 },
  sheetOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  addrOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  addrOptionAtivo: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  addrOptionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addrPrincipalTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    backgroundColor: colors.successBg,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sheetOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  sheetOptionMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
});
