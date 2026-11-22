import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../../components/BackHeader';
import { Button } from '../../../../components/Button';
import { Card } from '../../../../components/Card';
import { EstadoCarregamento } from '../../../../components/EstadoCarregamento';
import { Input } from '../../../../components/Input';
import { KeyboardScreen } from '../../../../components/KeyboardScreen';
import { colors } from '../../../../constants/colors';
import { useCarregar } from '../../../../hooks/useCarregar';
import {
  buscarAluno,
  criarEVincularResponsavel,
  listarResponsaveis,
  vincularResponsavel,
} from '../../../../services/alunos';
import { formatEndereco, formatPhone, maskCEP, maskPhone } from '../../../../utils/formatters';
import {
  criarResponsavelVazio,
  montarPayloadResponsavel,
  responsaveisDisponiveisParaVincular,
  validarResponsavel,
} from '../../../../utils/alunoForm';

async function carregarDados(studentId) {
  const [aluno, responsaveis] = await Promise.all([buscarAluno(studentId), listarResponsaveis()]);
  return { aluno, responsaveis };
}

export default function AdicionarResponsavelScreen() {
  const { id } = useLocalSearchParams();
  const { dados, erro, recarregar } = useCarregar(() => carregarDados(id), [id]);

  if (!dados) {
    return (
      <KeyboardScreen>
        <BackHeader title="Adicionar Responsável" subtitle="Vincule ou cadastre um responsável" />
        <EstadoCarregamento erro={erro} onTentarNovamente={recarregar} />
      </KeyboardScreen>
    );
  }

  return <ConteudoAdicionarResponsavel aluno={dados.aluno} todosResponsaveis={dados.responsaveis} />;
}

function ConteudoAdicionarResponsavel({ aluno, todosResponsaveis }) {
  const disponiveis = useMemo(
    () => responsaveisDisponiveisParaVincular(todosResponsaveis, aluno.guardians),
    [todosResponsaveis, aluno.guardians]
  );

  const [aba, setAba] = useState(() => (disponiveis.length > 0 ? 'existente' : 'novo'));
  const [busca, setBusca] = useState('');
  const [vinculandoId, setVinculandoId] = useState(null);
  const [responsavel, setResponsavel] = useState(criarResponsavelVazio);
  const [errors, setErrors] = useState({});
  const [salvando, setSalvando] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return disponiveis;
    return disponiveis.filter(
      (g) =>
        (g.name || '').toLowerCase().includes(termo) ||
        String(g.primaryPhoneNumber || '').includes(termo.replace(/\D/g, '') || termo)
    );
  }, [disponiveis, busca]);

  const setResp = (key, value) => setResponsavel((prev) => ({ ...prev, [key]: value }));
  const setEnd = (key, value) =>
    setResponsavel((prev) => ({ ...prev, endereco: { ...prev.endereco, [key]: value } }));

  const vincular = async (guardian) => {
    setVinculandoId(guardian.id);
    try {
      await vincularResponsavel(aluno.id, guardian.id);
      Alert.alert(
        'Responsável vinculado',
        `${guardian.name} agora está vinculado(a) a ${aluno.name}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Não foi possível vincular', e.message);
    } finally {
      setVinculandoId(null);
    }
  };

  const cadastrarNovo = async () => {
    const next = validarResponsavel(responsavel);
    setErrors(next);
    if (Object.keys(next).length) return;

    setSalvando(true);
    try {
      const payload = montarPayloadResponsavel({
        ...responsavel,
        endereco: {
          ...responsavel.endereco,
          principal: (aluno.guardians || []).length === 0,
        },
      });
      await criarEVincularResponsavel(aluno.id, payload);
      Alert.alert('Responsável adicionado', 'Responsável cadastrado e vinculado ao aluno!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Não foi possível cadastrar', e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardScreen>
      <BackHeader
        title="Adicionar Responsável"
        subtitle={`Aluno: ${aluno.name}`}
      />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, aba === 'existente' && styles.tabAtiva]}
          onPress={() => setAba('existente')}
        >
          <Ionicons
            name="link-outline"
            size={16}
            color={aba === 'existente' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, aba === 'existente' && styles.tabTextAtiva]}>
            Vincular existente ({disponiveis.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, aba === 'novo' && styles.tabAtiva]}
          onPress={() => setAba('novo')}
        >
          <Ionicons
            name="person-add-outline"
            size={16}
            color={aba === 'novo' ? colors.white : colors.textSecondary}
          />
          <Text style={[styles.tabText, aba === 'novo' && styles.tabTextAtiva]}>Cadastrar novo</Text>
        </TouchableOpacity>
      </View>

      {aba === 'existente' ? (
        disponiveis.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="people-outline" size={38} color={colors.border} />
            <Text style={styles.emptyTitle}>Nenhum responsável disponível para vincular</Text>
            <Text style={styles.emptyText}>
              Todos os responsáveis cadastrados já estão vinculados a este aluno. Cadastre um novo responsável.
            </Text>
            <Button title="Cadastrar Novo Responsável" onPress={() => setAba('novo')} style={styles.emptyBtn} />
          </Card>
        ) : (
          <>
            <Input
              label="Buscar responsável"
              placeholder="Nome ou telefone..."
              value={busca}
              onChangeText={setBusca}
              leftIcon="search-outline"
            />

            {filtrados.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>Nenhum responsável encontrado com essa busca.</Text>
              </Card>
            ) : (
              filtrados.map((g) => (
                <Card key={g.id} style={styles.guardianCard}>
                  <View style={styles.guardianInfo}>
                    <Text style={styles.guardianName}>{g.name}</Text>
                    {g.primaryPhoneNumber ? (
                      <Text style={styles.guardianMeta}>{formatPhone(g.primaryPhoneNumber)}</Text>
                    ) : null}
                    {g.address ? (
                      <Text style={styles.guardianMeta} numberOfLines={1}>
                        {formatEndereco(g.address)}
                      </Text>
                    ) : null}
                  </View>
                  <Button
                    title="Vincular"
                    variant="soft"
                    loading={vinculandoId === g.id}
                    disabled={Boolean(vinculandoId) && vinculandoId !== g.id}
                    onPress={() => vincular(g)}
                    style={styles.vincularBtn}
                  />
                </Card>
              ))
            )}
          </>
        )
      ) : (
        <>
          <Card>
            <Input
              label="Nome *"
              placeholder="Nome completo"
              value={responsavel.nome}
              onChangeText={(v) => setResp('nome', v.slice(0, 45))}
              error={errors.nome}
            />
            <Input
              label="Telefone *"
              placeholder="(11) 99999-9999"
              value={responsavel.tel1}
              onChangeText={(v) => setResp('tel1', maskPhone(v))}
              keyboardType="phone-pad"
              error={errors.tel1}
            />
            <Input
              label="Telefone secundário"
              placeholder="(11) 99999-9999"
              value={responsavel.tel2}
              onChangeText={(v) => setResp('tel2', maskPhone(v))}
              keyboardType="phone-pad"
              error={errors.tel2}
            />
            <Input
              label="E-mail"
              placeholder="email@exemplo.com"
              value={responsavel.email}
              onChangeText={(v) => setResp('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="CEP *"
              placeholder="00000-000"
              value={responsavel.endereco.cep}
              onChangeText={(v) => setEnd('cep', maskCEP(v))}
              keyboardType="number-pad"
              error={errors.cep}
            />
            <Input
              label="Logradouro *"
              placeholder="Rua / Avenida"
              value={responsavel.endereco.logradouro}
              onChangeText={(v) => setEnd('logradouro', v)}
              error={errors.logradouro}
            />
            <Input
              label="Número *"
              placeholder="123"
              value={responsavel.endereco.numero}
              onChangeText={(v) => setEnd('numero', v.slice(0, 10))}
              error={errors.numero}
            />
            <Input
              label="Complemento"
              placeholder="Apartamento, bloco..."
              value={responsavel.endereco.complemento}
              onChangeText={(v) => setEnd('complemento', v)}
            />
            <Input
              label="Bairro *"
              placeholder="Bairro"
              value={responsavel.endereco.bairro}
              onChangeText={(v) => setEnd('bairro', v)}
              error={errors.bairro}
            />
            <Input
              label="Cidade *"
              placeholder="Cidade"
              value={responsavel.endereco.cidade}
              onChangeText={(v) => setEnd('cidade', v)}
              error={errors.cidade}
            />
            <Input
              label="UF *"
              placeholder="SP"
              value={responsavel.endereco.uf}
              onChangeText={(v) => setEnd('uf', v.toUpperCase().slice(0, 2))}
              autoCapitalize="characters"
              error={errors.uf}
            />
          </Card>

          <View style={styles.actions}>
            <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={styles.actionBtn} />
            <Button
              title="Cadastrar e Vincular"
              onPress={cadastrarNovo}
              loading={salvando}
              style={styles.actionBtn}
            />
          </View>
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
  },
  tabAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tabTextAtiva: { color: colors.white },
  emptyCard: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 6, alignSelf: 'stretch', borderRadius: 14 },
  guardianCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guardianInfo: { flex: 1 },
  guardianName: { fontSize: 15, fontWeight: '700', color: colors.text },
  guardianMeta: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  vincularBtn: { minHeight: 38, paddingHorizontal: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14 },
});
