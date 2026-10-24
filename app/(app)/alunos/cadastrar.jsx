import { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { Card } from '../../../components/Card';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { colors } from '../../../constants/colors';
import { useCarregar } from '../../../hooks/useCarregar';
import { listarEscolas } from '../../../services/escolas';
import { criarAluno } from '../../../services/alunos';
import { brToISO, maskCEP, maskDate, maskMoney, maskPhone, parseMoney } from '../../../utils/formatters';
import { isRequired, isValidEmail, isValidPhone } from '../../../utils/validators';

export default function CadastroAlunoScreen() {
  const { dados: escolas, erro: erroEscolas, recarregar } = useCarregar(listarEscolas);
  const [nome, setNome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [professor, setProfessor] = useState('');
  const [escolaId, setEscolaId] = useState('');
  const [serie, setSerie] = useState('');
  const [sala, setSala] = useState('');
  const [mensalidade, setMensalidade] = useState('');
  const [vencimentoDia, setVencimentoDia] = useState('5');
  const [responsavel, setResponsavel] = useState({
    nome: '',
    tel1: '',
    email: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
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

  const submit = async () => {
    const end = responsavel.endereco;
    const birthdate = nascimento ? brToISO(nascimento) : null;
    const monthlyFee = parseMoney(mensalidade);
    const dueDate = Number(vencimentoDia);
    const next = {};
    if (!isRequired(nome)) next.nome = 'Obrigatório';
    if (nascimento && (!birthdate || birthdate >= new Date().toISOString().slice(0, 10))) {
      next.nascimento = 'Informe uma data válida no passado';
    }
    if (!isRequired(professor)) next.professor = 'Obrigatório';
    if (!escolaId) next.escolaId = 'Selecione uma escola';
    if (isNaN(monthlyFee) || monthlyFee <= 0) next.mensalidade = 'Informe um valor maior que zero';
    if (!(dueDate >= 1 && dueDate <= 31)) next.vencimentoDia = 'Informe um dia entre 1 e 31';
    if (!isRequired(responsavel.nome)) next.respNome = 'Obrigatório';
    if (!isValidPhone(responsavel.tel1)) next.respTel = 'Telefone inválido';
    if (responsavel.email && !isValidEmail(responsavel.email)) next.respEmail = 'E-mail inválido';
    if (end.cep.replace(/\D/g, '').length !== 8) next.respCep = 'CEP inválido';
    if (!isRequired(end.logradouro)) next.respLog = 'Obrigatório';
    if (!isRequired(end.numero)) next.respNum = 'Obrigatório';
    if (!isRequired(end.bairro)) next.respBairro = 'Obrigatório';
    if (!isRequired(end.cidade)) next.respCidade = 'Obrigatório';
    if (end.uf.length !== 2) next.respUf = 'Obrigatório';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await criarAluno({
        name: nome.trim(),
        professor: professor.trim(),
        birthdate,
        grade: serie ? Number(serie) : null,
        classroom: sala.trim() || null,
        monthlyFee,
        dueDate,
        schoolId: escolaId,
        guardian: [
          {
            name: responsavel.nome.trim(),
            primaryPhoneNumber: responsavel.tel1.replace(/\D/g, ''),
            email: responsavel.email.trim() || null,
            address: {
              street: end.logradouro.trim(),
              number: end.numero.trim(),
              additionalDetails: end.complemento.trim() || null,
              neighborhood: end.bairro.trim(),
              city: end.cidade.trim(),
              federalUnit: end.uf,
              zipCode: end.cep.replace(/\D/g, ''),
              type: 'Residential',
              principal: true,
            },
          },
        ],
      });
      Alert.alert('Aluno cadastrado', 'Aluno cadastrado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (erro) {
      Alert.alert('Não foi possível cadastrar', erro.message);
    } finally {
      setLoading(false);
    }
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
        placeholder="DD/MM/AAAA"
        value={nascimento}
        onChangeText={(v) => setNascimento(maskDate(v))}
        keyboardType="number-pad"
        error={errors.nascimento}
      />
      <Input
        label="Professor *"
        placeholder="Nome do professor"
        value={professor}
        onChangeText={setProfessor}
        error={errors.professor}
      />

      <Text style={styles.label}>Escola *</Text>
      {!escolas ? (
        <EstadoCarregamento erro={erroEscolas} onTentarNovamente={recarregar} />
      ) : escolas.length === 0 ? (
        <Text style={styles.hint}>Nenhuma escola cadastrada. Cadastre uma escola antes do aluno.</Text>
      ) : (
        <View style={styles.chips}>
          {escolas.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.chip, escolaId === e.id && styles.chipActive]}
              onPress={() => setEscolaId(e.id)}
            >
              <Text style={[styles.chipText, escolaId === e.id && styles.chipTextActive]}>{e.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.escolaId ? <Text style={styles.error}>{errors.escolaId}</Text> : null}

      <Input
        label="Série"
        placeholder="Ex: 1"
        value={serie}
        onChangeText={(v) => setSerie(v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
      />
      <Input label="Sala" placeholder="Ex: A" value={sala} onChangeText={setSala} />
      <Input
        label="Mensalidade (R$) *"
        placeholder="0,00"
        value={mensalidade}
        onChangeText={(v) => setMensalidade(maskMoney(v))}
        keyboardType="number-pad"
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
          onChangeText={(v) => setResp('nome', v.slice(0, 45))}
          error={errors.respNome}
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
          error={errors.respEmail}
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
          label="Número *"
          placeholder="123"
          value={responsavel.endereco.numero}
          onChangeText={(v) => setEnd('numero', v.slice(0, 10))}
          error={errors.respNum}
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
          error={errors.respBairro}
        />
        <Input
          label="Cidade *"
          placeholder="Cidade"
          value={responsavel.endereco.cidade}
          onChangeText={(v) => setEnd('cidade', v)}
          error={errors.respCidade}
        />
        <Input
          label="UF *"
          placeholder="SP"
          value={responsavel.endereco.uf}
          onChangeText={(v) => setEnd('uf', v.toUpperCase().slice(0, 2))}
          autoCapitalize="characters"
          error={errors.respUf}
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
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
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
