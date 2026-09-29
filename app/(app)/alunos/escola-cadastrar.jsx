import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { BackHeader } from '../../../components/BackHeader';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { colors } from '../../../constants/colors';
import { maskCEP } from '../../../utils/formatters';
import { isRequired } from '../../../utils/validators';

const NIVEIS = [
  { value: 'CRECHE', label: 'Creche' },
  { value: 'PRE_ESCOLA', label: 'Pré-escola' },
  { value: 'ENSINO_FUNDAMENTAL', label: 'Ensino Fundamental' },
  { value: 'ENSINO_MEDIO', label: 'Ensino Médio' },
];

export default function CadastroEscolaScreen() {
  const [nome, setNome] = useState('');
  const [nivelEnsino, setNivelEnsino] = useState('');
  const [endereco, setEndereco] = useState({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setEnd = (key, value) => setEndereco((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const next = {};
    if (!isRequired(nome)) next.nome = 'Obrigatório';
    if (!isRequired(nivelEnsino)) next.nivelEnsino = 'Selecione o nível';
    if (!isRequired(endereco.cep)) next.cep = 'Obrigatório';
    if (!isRequired(endereco.logradouro)) next.logradouro = 'Obrigatório';
    if (!isRequired(endereco.numero)) next.numero = 'Obrigatório';
    if (!isRequired(endereco.bairro)) next.bairro = 'Obrigatório';
    if (!isRequired(endereco.cidade)) next.cidade = 'Obrigatório';
    if (!isRequired(endereco.uf)) next.uf = 'Obrigatório';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Escola cadastrada', 'Cadastro mockado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  };

  return (
    <KeyboardScreen>
      <BackHeader title="Cadastrar Escola" subtitle="Registro de unidades escolares" />

      <Text style={styles.section}>Dados da Escola</Text>
      <Input
        label="Nome da Escola *"
        placeholder="Digite o nome da escola"
        value={nome}
        onChangeText={setNome}
        error={errors.nome}
      />

      <Text style={styles.label}>Nível de Ensino *</Text>
      <View style={styles.chips}>
        {NIVEIS.map((n) => (
          <Button
            key={n.value}
            title={n.label}
            variant={nivelEnsino === n.value ? 'primary' : 'soft'}
            onPress={() => setNivelEnsino(n.value)}
            style={styles.chip}
          />
        ))}
      </View>
      {errors.nivelEnsino ? <Text style={styles.error}>{errors.nivelEnsino}</Text> : null}

      <Text style={styles.section}>Endereço</Text>
      <Input
        label="CEP *"
        placeholder="00000-000"
        value={endereco.cep}
        onChangeText={(v) => setEnd('cep', maskCEP(v))}
        keyboardType="number-pad"
        error={errors.cep}
      />
      <Input
        label="Logradouro *"
        placeholder="Rua / Avenida"
        value={endereco.logradouro}
        onChangeText={(v) => setEnd('logradouro', v)}
        error={errors.logradouro}
      />
      <Input
        label="Número *"
        placeholder="Ex: 123"
        value={endereco.numero}
        onChangeText={(v) => setEnd('numero', v)}
        error={errors.numero}
      />
      <Input
        label="Complemento"
        placeholder="Apartamento, bloco..."
        value={endereco.complemento}
        onChangeText={(v) => setEnd('complemento', v)}
      />
      <Input
        label="Bairro *"
        placeholder="Digite o bairro"
        value={endereco.bairro}
        onChangeText={(v) => setEnd('bairro', v)}
        error={errors.bairro}
      />
      <Input
        label="Cidade *"
        placeholder="Digite a cidade"
        value={endereco.cidade}
        onChangeText={(v) => setEnd('cidade', v)}
        error={errors.cidade}
      />
      <Input
        label="UF *"
        placeholder="SP"
        value={endereco.uf}
        onChangeText={(v) => setEnd('uf', v.toUpperCase().slice(0, 2))}
        autoCapitalize="characters"
        error={errors.uf}
      />

      <Button title="Cadastrar Escola" onPress={submit} loading={loading} style={styles.submit} />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { minHeight: 38, borderRadius: 10, paddingHorizontal: 12 },
  error: { color: colors.error, fontSize: 12, marginBottom: 8, marginTop: -4 },
  submit: { marginTop: 8, borderRadius: 14 },
});
