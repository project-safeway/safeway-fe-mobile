import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, FlatList, Pressable } from 'react-native';
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
import { colors } from '../../../../constants/colors';
import { mockItinerarios, mockEscolasComAlunos, mockAlunosDetalhe } from '../../../../data/mock';
import { isRequired } from '../../../../utils/validators';
import { HORARIO_OPTIONS, TIPO_VIAGEM_OPTIONS } from '../../../../utils/constants';
import { buildTrajeto, reindexTrajeto, toParadas } from '../../../../utils/trajeto';

export default function EditarItinerarioScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef();
  const base = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );

  const [nome, setNome] = useState(base.nome);
  const [horarioInicio, setHorarioInicio] = useState(base.horarioInicio);
  const [horarioFim, setHorarioFim] = useState(base.horarioFim);
  const [tipoViagem, setTipoViagem] = useState(base.tipoViagem);
  const [trajeto, setTrajeto] = useState(() => buildTrajeto(base));
  const [addModal, setAddModal] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const totalAlunos = trajeto.filter((t) => t.tipo === 'aluno').length;
  const totalEscolas = trajeto.length - totalAlunos;

  const opcoesAdicionar = useMemo(() => {
    const noTrajeto = new Set(trajeto.map((t) => t.key));
    if (addModal === 'aluno') {
      return mockEscolasComAlunos.flatMap(({ escola, alunos }) =>
        alunos
          .filter((a) => !noTrajeto.has(`aluno-${a.id}`))
          .map((a) => ({
            id: a.id,
            nome: a.nome,
            escola: escola.nome,
            responsavel: mockAlunosDetalhe[a.id]?.responsaveis?.[0]?.nome,
          }))
      );
    }
    if (addModal === 'escola') {
      return mockEscolasComAlunos
        .map(({ escola }) => escola)
        .filter((e) => !noTrajeto.has(`escola-${e.id}`))
        .map((e) => ({ id: e.id, nome: e.nome, cidade: e.endereco?.cidade }));
    }
    return [];
  }, [addModal, trajeto]);

  const adicionar = (option) => {
    setTrajeto((prev) =>
      reindexTrajeto([...prev, { ...option, key: `${addModal}-${option.id}`, tipo: addModal }])
    );
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
          onPress: () => setTrajeto((prev) => reindexTrajeto(prev.filter((t) => t.key !== item.key))),
        },
      ]
    );
  }, []);

  const salvar = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome é obrigatório';
    if (!horarioInicio) next.horarioInicio = 'Horário de início é obrigatório';
    if (!horarioFim) next.horarioFim = 'Horário de fim é obrigatório';
    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
      next.horarioFim = 'Horário de fim deve ser maior que o início';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      nome,
      horarioInicio: `${horarioInicio}:00`,
      horarioFim: `${horarioFim}:00`,
      tipoViagem,
      ativo: base.ativo ?? true,
      paradas: toParadas(trajeto),
    };

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('[mock] PUT /itinerarios/' + base.id, payload);
      Alert.alert('Itinerário atualizado', 'Alterações salvas com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  };

  const renderItem = useCallback(
    ({ item, index }) => {
      const isEscola = item.tipo === 'escola';
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
              </>
            )}
          </View>

          <TouchableOpacity onPress={() => remover(item)} hitSlop={8} accessibilityLabel="Remover">
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      );
    },
    [remover]
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
                onDragEnd={({ data }) => setTrajeto(reindexTrajeto(data))}
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
  sheetList: { marginBottom: 12 },
  sheetOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  sheetOptionMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
});
