import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockEscolasComAlunos } from '../../../data/mock';

export default function ListaAlunosScreen() {
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(() =>
    Object.fromEntries(mockEscolasComAlunos.map((item) => [item.escola.id, true]))
  );
  const [escolas, setEscolas] = useState(mockEscolasComAlunos);

  const filtrar = (alunos) => {
    if (!busca.trim()) return alunos;
    return alunos.filter((a) => a.nome?.toLowerCase().includes(busca.toLowerCase()));
  };

  const data = useMemo(() => escolas, [escolas]);

  const deleteEscola = (escolaId, nome, alunos) => {
    if (alunos?.length) {
      Alert.alert(
        'Não é possível excluir',
        `A escola "${nome}" possui ${alunos.length} aluno(s). Remova os alunos antes.`
      );
      return;
    }
    Alert.alert('Excluir Escola', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setEscolas((prev) => prev.filter((i) => i.escola.id !== escolaId)),
      },
    ]);
  };

  const deleteAluno = (alunoId, nome) => {
    Alert.alert('Excluir Aluno', `Excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () =>
          setEscolas((prev) =>
            prev.map((item) => ({
              ...item,
              alunos: item.alunos.filter((a) => a.id !== alunoId),
            }))
          ),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.escola.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <BackHeader
              title="Alunos"
              subtitle="Listagem de alunos agrupados por escola"
              showBack={false}
            />

            <View style={styles.search}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar aluno por nome..."
                placeholderTextColor={colors.textMuted}
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => router.push('/(app)/alunos/escola-cadastrar')}
              >
                <Text style={styles.btnOutlineText}>+ Cadastrar Escola</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => router.push('/(app)/alunos/cadastrar')}
              >
                <Text style={styles.btnPrimaryText}>+ Cadastrar Aluno</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const { escola, alunos } = item;
          const isOpen = !!aberto[escola.id];
          const filtrados = filtrar(alunos);

          return (
            <Card style={styles.schoolCard}>
              <View style={styles.schoolHead}>
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName}>{escola.nome}</Text>
                  <Text style={styles.schoolAddr}>
                    {escola.endereco?.logradouro || escola.endereco?.cidade || 'Endereço não informado'}
                  </Text>
                </View>
                <View style={styles.schoolActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => deleteEscola(escola.id, escola.nome, alunos)}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => setAberto((p) => ({ ...p, [escola.id]: !p[escola.id] }))}
                  >
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {isOpen ? (
                <View style={styles.alunosWrap}>
                  {filtrados.length === 0 ? (
                    <Text style={styles.empty}>
                      {busca.trim()
                        ? 'Nenhum aluno encontrado com esse nome'
                        : 'Nenhum aluno cadastrado nesta escola'}
                    </Text>
                  ) : (
                    filtrados.map((aluno) => (
                      <TouchableOpacity
                        key={aluno.id}
                        style={styles.alunoRow}
                        onPress={() => router.push(`/(app)/alunos/${aluno.id}`)}
                      >
                        <View style={styles.alunoAvatar}>
                          <Ionicons name="person" size={18} color={colors.mapBlue} />
                        </View>
                        <View style={styles.alunoInfo}>
                          <Text style={styles.alunoName}>{aluno.nome}</Text>
                          <Text style={styles.alunoMeta}>
                            {[aluno.serie && `Série ${aluno.serie}`, aluno.sala && `Sala ${aluno.sala}`]
                              .filter(Boolean)
                              .join(' • ')}
                          </Text>
                          {aluno.professor ? (
                            <Text style={styles.alunoProf}>Prof: {aluno.professor}</Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          onPress={() => deleteAluno(aluno.id, aluno.nome)}
                          hitSlop={8}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              ) : null}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btnOutline: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  btnOutlineText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  btnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { fontWeight: '700', color: colors.white, fontSize: 13 },
  schoolCard: { padding: 0, overflow: 'hidden' },
  schoolHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  schoolInfo: { flex: 1, marginRight: 8 },
  schoolName: { fontSize: 16, fontWeight: '700', color: colors.text },
  schoolAddr: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  schoolActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  alunosWrap: { padding: 12, gap: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: 16 },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
  },
  alunoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alunoInfo: { flex: 1 },
  alunoName: { fontSize: 15, fontWeight: '700', color: colors.text },
  alunoMeta: { marginTop: 2, fontSize: 12, color: colors.primary },
  alunoProf: { marginTop: 2, fontSize: 11, color: colors.textMuted },
});
