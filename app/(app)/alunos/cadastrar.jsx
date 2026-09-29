import { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { Card } from '../../../components/Card';
import { colors } from '../../../constants/colors';
import { mockEscolasComAlunos } from '../../../data/mock';
import { maskCEP, maskCPF, maskPhone, maskDate } from '../../../utils/formatters';
import { isRequired, isValidPhone } from '../../../utils/validators';

export default function CadastroAlunoScreen() {
  const escolas = mockEscolasComAlunos.map((i) => i.escola);
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [professor, setProfessor] = useState('');
  const [escolaId, setEscolaId] = useState('');
  const [serie, setSerie] = useState('');
  const [sala, setSala] = useState('');
  const [mensalidade, setMensalidade] = useState('0');
  const [vencimentoDia, setVencimentoDia] = useState('5');
  const [responsavel, setResponsavel] = useState({
    nome: '',
    cpf: '',
    tel1: '',
    email: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
    },
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setResp = (key, value) => setResponsavel((p) => ({ ...p, [key]: value }));
  const setEnd = (key, value) =>
    setResponsavel((p) => ({ ...p, endereco: { ...p.endereco, [key]: value } }));

  const submit = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Obrigatório';
    if (!escolaId) next.escolaId = 'Selecione uma escola';
    if (!isRequired(mensalidade)) next.mensalidade = 'Obrigatório';
    if (!isRequired(vencimentoDia)) next.vencimentoDia = 'Obrigatório';
    if (!isRequired(responsavel.nome)) next.respNome = 'Obrigatório';
    if (!isValidPhone(responsavel.tel1)) next.respTel = 'Telefone inválido';
    if (!isRequired(responsavel.endereco.cep)) next.respCep = 'Obrigatório';
    if (!isRequired(responsavel.endereco.logradouro)) next.respLog = 'Obrigatório';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Aluno cadastrado', 'Cadastro mockado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Aluno" subtitle="Registro de novos estudantes" />

      <Text style={styles.section}>Dados do Aluno</Text>
      <Input
        label="Nome do Aluno *"
        placeholder="Digite o nome completo"
        value={nome}
        onChangeText={setNome}
        error={errors.nome}
      />
      <Input
        label="Data de Nascimento"
        placeholder="DD/MM/YYYY"
        value={nascimento}
        onChangeText={(v) => setNascimento(maskDate(v))}
        keyboardType="number-pad"
      />
      <Input
        label="Professor"
        placeholder="Nome do professor"
        value={professor}
        onChangeText={setProfessor}
      />

      <Text style={styles.label}>Escola *</Text>
      <View style={styles.chips}>
        {escolas.map((e) => (
          <TouchableOpacity
            key={e.id}
            style={[styles.chip, escolaId === String(e.id) && styles.chipActive]}
            onPress={() => setEscolaId(String(e.id))}
          >
            <Text style={[styles.chipText, escolaId === String(e.id) && styles.chipTextActive]}>
              {e.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.escolaId ? <Text style={styles.error}>{errors.escolaId}</Text> : null}

      <Input
        label="Série"
        placeholder="Ex: 1"
        value={serie}
        onChangeText={(v) => setSerie(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
      />
      <Input label="Sala" placeholder="Ex: A" value={sala} onChangeText={setSala} />
      <Input
        label="Mensalidade (R$) *"
        placeholder="0.00"
        value={mensalidade}
        onChangeText={setMensalidade}
        keyboardType="decimal-pad"
        error={errors.mensalidade}
      />
      <Input
        label="Dia do Vencimento *"
        placeholder="5"
        value={vencimentoDia}
        onChangeText={(v) => setVencimentoDia(v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        error={errors.vencimentoDia}
      />

      <Text style={styles.section}>Responsável *</Text>
      <Card>
        <Input
          label="Nome *"
          placeholder="Nome completo"
          value={responsavel.nome}
          onChangeText={(v) => setResp('nome', v)}
          error={errors.respNome}
        />
        <Input
          label="CPF"
          placeholder="000.000.000-00"
          value={responsavel.cpf}
          onChangeText={(v) => setResp('cpf', maskCPF(v))}
          keyboardType="number-pad"
        />
        <Input
          label="Telefone *"
          placeholder="(11) 99999-9999"
          value={responsavel.tel1}
          onChangeText={(v) => setResp('tel1', maskPhone(v))}
          keyboardType="phone-pad"
          error={errors.respTel}
        />
        <Input
          label="E-mail"
          placeholder="email@exemplo.com"
          value={responsavel.email}
          onChangeText={(v) => setResp('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="CEP *"
          placeholder="00000-000"
          value={responsavel.endereco.cep}
          onChangeText={(v) => setEnd('cep', maskCEP(v))}
          keyboardType="number-pad"
          error={errors.respCep}
        />
        <Input
          label="Logradouro *"
          placeholder="Rua / Avenida"
          value={responsavel.endereco.logradouro}
          onChangeText={(v) => setEnd('logradouro', v)}
          error={errors.respLog}
        />
        <Input
          label="Número"
          placeholder="123"
          value={responsavel.endereco.numero}
          onChangeText={(v) => setEnd('numero', v)}
        />
        <Input
          label="Bairro"
          placeholder="Bairro"
          value={responsavel.endereco.bairro}
          onChangeText={(v) => setEnd('bairro', v)}
        />
        <Input
          label="Cidade"
          placeholder="Cidade"
          value={responsavel.endereco.cidade}
          onChangeText={(v) => setEnd('cidade', v)}
        />
        <Input
          label="UF"
          placeholder="SP"
          value={responsavel.endereco.uf}
          onChangeText={(v) => setEnd('uf', v.toUpperCase().slice(0, 2))}
          autoCapitalize="characters"
        />
      </Card>

      <Button title="Cadastrar Aluno" onPress={submit} loading={loading} style={styles.submit} />
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: colors.white },
  error: { color: colors.error, fontSize: 12, marginBottom: 8, marginTop: -4 },
  submit: { marginTop: 8, borderRadius: 14 },
});
