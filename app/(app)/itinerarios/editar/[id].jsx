import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../../components/Input';
import { Button } from '../../../../components/Button';
import { BackHeader } from '../../../../components/BackHeader';
import { Card } from '../../../../components/Card';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { colors } from '../../../../constants/colors';
import { mockItinerarios, mockEscolasComAlunos } from '../../../../data/mock';
import { isRequired } from '../../../../utils/validators';

const HORARIOS = [
  '06:00', '06:30', '07:00', '07:30', '08:00',
  '12:00', '12:30', '13:00', '13:30', '14:00',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00',
];

function buildTrajeto(itinerario) {
  const alunos = (itinerario.alunos || []).map((a) => ({
    key: `aluno-${a.alunoId}`,
    id: a.alunoId,
    tipo: 'aluno',
    nome: a.nomeAluno,
    meta: a.nomeEscola || a.nomeResponsavel || '',
    ordemGlobal: a.ordemGlobal || a.ordemEmbarque || 0,
  }));
  const escolas = (itinerario.escolas || []).map((e) => ({
    key: `escola-${e.escolaId}`,
    id: e.escolaId,
    tipo: 'escola',
    nome: e.nome,
    meta: e.cidade || '',
    ordemGlobal: e.ordemGlobal || e.ordemVisita || 0,
  }));
  return [...alunos, ...escolas].sort((a, b) => a.ordemGlobal - b.ordemGlobal);
}

function reindex(list) {
  return list.map((item, index) => ({ ...item, ordemGlobal: index + 1 }));
}

export default function EditarItinerarioScreen() {
  const { id } = useLocalSearchParams();
  const base = useMemo(
    () => mockItinerarios.find((i) => String(i.id) === String(id)) || mockItinerarios[0],
    [id]
  );

  const [nome, setNome] = useState(base.nome);
  const [horarioInicio, setHorarioInicio] = useState(base.horarioInicio);
  const [horarioFim, setHorarioFim] = useState(base.horarioFim);
  const [tipoViagem, setTipoViagem] = useState(base.tipoViagem);
  const [trajeto, setTrajeto] = useState(() => buildTrajeto(base));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [orderModal, setOrderModal] = useState(null);
  const [addModal, setAddModal] = useState(null);

  const alunosDisponiveis = useMemo(() => {
    const noTrajeto = new Set(trajeto.filter((t) => t.tipo === 'aluno').map((t) => t.id));
    return mockEscolasComAlunos.flatMap((item) =>
      item.alunos
        .filter((a) => !noTrajeto.has(a.id))
        .map((a) => ({
          id: a.id,
          nome: a.nome,
          meta: item.escola.nome,
        }))
    );
  }, [trajeto]);

  const escolasDisponiveis = useMemo(() => {
    const noTrajeto = new Set(trajeto.filter((t) => t.tipo === 'escola').map((t) => t.id));
    return mockEscolasComAlunos
      .map((item) => item.escola)
      .filter((e) => !noTrajeto.has(e.id))
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        meta: e.endereco?.cidade || '',
      }));
  }, [trajeto]);

  const moveToIndex = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= trajeto.length || fromIndex === toIndex) return;
    const copy = [...trajeto];
    const [item] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, item);
    setTrajeto(reindex(copy));
  };

  const remover = (item) => {
    Alert.alert(
      'Remover do trajeto',
      `Remover ${item.tipo === 'aluno' ? 'aluno' : 'escola'} "${item.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () =>
            setTrajeto((prev) => reindex(prev.filter((t) => t.key !== item.key))),
        },
      ]
    );
  };

  const adicionar = (tipo, option) => {
    setTrajeto((prev) =>
      reindex([
        ...prev,
        {
          key: `${tipo}-${option.id}`,
          id: option.id,
          tipo,
          nome: option.nome,
          meta: option.meta,
          ordemGlobal: prev.length + 1,
        },
      ])
    );
    setAddModal(null);
  };

  const salvar = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Nome é obrigatório';
    if (!horarioInicio) next.horarioInicio = 'Obrigatório';
    if (!horarioFim) next.horarioFim = 'Obrigatório';
    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
      next.horarioFim = 'Horário de fim deve ser maior que o início';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Itinerário atualizado', 'Alterações salvas (mock).', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  };

  const addOptions = addModal === 'aluno' ? alunosDisponiveis : escolasDisponiveis;

  return (
    <>
      <KeyboardScreen>
        <BackHeader
          title="Editar Itinerário"
          subtitle="Altere informações e o planejamento de rotas"
        />

        <Text style={styles.section}>Informações do Itinerário</Text>
        <Input
          label="Nome do Itinerário *"
          value={nome}
          onChangeText={setNome}
          error={errors.nome}
        />

        <Text style={styles.label}>Tipo de viagem *</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.chip, tipoViagem === 'SO_IDA' && styles.chipActive]}
            onPress={() => setTipoViagem('SO_IDA')}
          >
            <Text style={[styles.chipText, tipoViagem === 'SO_IDA' && styles.chipTextActive]}>
              Ida
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, tipoViagem === 'SO_VOLTA' && styles.chipActive]}
            onPress={() => setTipoViagem('SO_VOLTA')}
          >
            <Text style={[styles.chipText, tipoViagem === 'SO_VOLTA' && styles.chipTextActive]}>
              Volta
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Horário de início *</Text>
        <View style={styles.chipsWrap}>
          {HORARIOS.map((h) => (
            <TouchableOpacity
              key={`ini-${h}`}
              style={[styles.timeChip, horarioInicio === h && styles.chipActive]}
              onPress={() => setHorarioInicio(h)}
            >
              <Text style={[styles.chipText, horarioInicio === h && styles.chipTextActive]}>
                {h}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.horarioInicio ? <Text style={styles.error}>{errors.horarioInicio}</Text> : null}

        <Text style={styles.label}>Horário de fim *</Text>
        <View style={styles.chipsWrap}>
          {HORARIOS.map((h) => (
            <TouchableOpacity
              key={`fim-${h}`}
              style={[styles.timeChip, horarioFim === h && styles.chipActive]}
              onPress={() => setHorarioFim(h)}
            >
              <Text style={[styles.chipText, horarioFim === h && styles.chipTextActive]}>{h}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.horarioFim ? <Text style={styles.error}>{errors.horarioFim}</Text> : null}

        <View style={styles.planHead}>
          <View>
            <Text style={styles.section}>Planejamento de Rotas</Text>
            <Text style={styles.planMeta}>
              {trajeto.filter((t) => t.tipo === 'aluno').length} aluno(s) •{' '}
              {trajeto.filter((t) => t.tipo === 'escola').length} escola(s)
            </Text>
          </View>
        </View>

        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModal('aluno')}>
            <Ionicons name="person-add-outline" size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Adicionar Aluno</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, styles.addBtnSchool]}
            onPress={() => setAddModal('escola')}
          >
            <Ionicons name="school-outline" size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Adicionar Escola</Text>
          </TouchableOpacity>
        </View>

        {trajeto.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>Nenhum item no trajeto</Text>
            <Text style={styles.emptyText}>
              Adicione alunos e escolas para planejar sua rota
            </Text>
          </Card>
        ) : (
          trajeto.map((item, index) => (
            <Card key={item.key} style={styles.stopCard}>
              <View style={styles.stopRow}>
                <TouchableOpacity
                  style={styles.orderSelect}
                  onPress={() => setOrderModal({ key: item.key, index })}
                >
                  <Text style={styles.orderSelectText}>{index + 1}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.white} />
                </TouchableOpacity>

                <View
                  style={[
                    styles.typeIcon,
                    item.tipo === 'escola' ? styles.typeSchool : styles.typeStudent,
                  ]}
                >
                  <Ionicons
                    name={item.tipo === 'escola' ? 'business' : 'person'}
                    size={16}
                    color={item.tipo === 'escola' ? colors.success : colors.mapBlue}
                  />
                </View>

                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{item.nome}</Text>
                  <Text style={styles.stopMeta}>
                    {item.tipo === 'aluno' ? 'Aluno' : 'Escola'}
                    {item.meta ? ` • ${item.meta}` : ''}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => remover(item)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <Button title="Salvar alterações" onPress={salvar} loading={loading} style={styles.save} />
      </KeyboardScreen>

      <Modal visible={!!orderModal} transparent animationType="fade" onRequestClose={() => setOrderModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOrderModal(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Definir ordem</Text>
            <Text style={styles.modalHint}>Escolha a posição no trajeto</Text>
            <FlatList
              data={trajeto.map((_, i) => i)}
              keyExtractor={(i) => String(i)}
              style={styles.modalList}
              renderItem={({ item: toIndex }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    orderModal?.index === toIndex && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    moveToIndex(orderModal.index, toIndex);
                    setOrderModal(null);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      orderModal?.index === toIndex && styles.modalOptionTextActive,
                    ]}
                  >
                    Posição {toIndex + 1}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <Button title="Cancelar" variant="outline" onPress={() => setOrderModal(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!addModal} transparent animationType="fade" onRequestClose={() => setAddModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddModal(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {addModal === 'aluno' ? 'Adicionar Aluno' : 'Adicionar Escola'}
            </Text>
            {addOptions.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum item disponível para adicionar.</Text>
            ) : (
              <FlatList
                data={addOptions}
                keyExtractor={(item) => String(item.id)}
                style={styles.modalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => adicionar(addModal, item)}
                  >
                    <Text style={styles.modalOptionText}>{item.nome}</Text>
                    {item.meta ? <Text style={styles.modalOptionMeta}>{item.meta}</Text> : null}
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
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChip: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: 12, marginBottom: 8 },
  planHead: { marginTop: 8 },
  planMeta: { fontSize: 13, color: colors.textMuted, marginTop: -6, marginBottom: 12 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  addBtnSchool: { backgroundColor: colors.success },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  emptyTitle: { textAlign: 'center', fontWeight: '700', color: colors.text, marginBottom: 4 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginBottom: 12 },
  stopCard: { paddingVertical: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderSelect: {
    minWidth: 48,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  orderSelectText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeStudent: { backgroundColor: '#DBEAFE' },
  typeSchool: { backgroundColor: colors.successBg },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '700', color: colors.text },
  stopMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  save: { marginTop: 12, marginBottom: 8, borderRadius: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalHint: { marginTop: 4, marginBottom: 12, fontSize: 13, color: colors.textMuted },
  modalList: { marginBottom: 12 },
  modalOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalOptionActive: { backgroundColor: colors.primarySoft },
  modalOptionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  modalOptionTextActive: { color: colors.primary },
  modalOptionMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
});
