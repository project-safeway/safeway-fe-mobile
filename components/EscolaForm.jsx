import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { colors } from '../constants/colors';
import { maskCEP } from '../utils/formatters';
import { isRequired } from '../utils/validators';

export const NIVEIS_ENSINO = [
  { value: 'CRECHE', label: 'Creche' },
  { value: 'PRE_ESCOLA', label: 'Pré-escola' },
  { value: 'ENSINO_FUNDAMENTAL', label: 'Ensino Fundamental' },
  { value: 'ENSINO_MEDIO', label: 'Ensino Médio' },
];

const ENDERECO_VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

/**
 * Formulário de escola (cadastro e edição), com o payload no formato da API.
 * @param {Object} props
 * @param {{ nome?: string, nivelEnsino?: string, endereco?: object }} [props.initialValues]
 * @param {string} props.submitLabel
 * @param {(payload: object) => Promise<void> | void} props.onSubmit
 * @param {() => void} [props.onCancel] exibe o botão Cancelar ao lado do envio
 */
export function EscolaForm({ initialValues, submitLabel, onSubmit, onCancel }) {
  const [nome, setNome] = useState(initialValues?.nome ?? '');
  const [nivelEnsino, setNivelEnsino] = useState(initialValues?.nivelEnsino ?? '');
  const [endereco, setEndereco] = useState(() => {
    const inicial = { ...ENDERECO_VAZIO, ...initialValues?.endereco };
    return {
      ...Object.fromEntries(Object.keys(ENDERECO_VAZIO).map((k) => [k, inicial[k] ?? ''])),
      cep: maskCEP(String(inicial.cep ?? '')),
    };
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setEnd = (key, value) => setEndereco((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
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
    try {
      await onSubmit({
        nome: nome.trim(),
        nivelEnsino,
        endereco: {
          logradouro: endereco.logradouro,
          numero: endereco.numero,
          complemento: endereco.complemento || null,
          bairro: endereco.bairro,
          cidade: endereco.cidade,
          uf: endereco.uf,
          cep: endereco.cep.replace(/\D/g, ''),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
        {NIVEIS_ENSINO.map((n) => (
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

      {onCancel ? (
        <View style={styles.actions}>
          <Button title="Cancelar" variant="outline" onPress={onCancel} style={styles.actionBtn} />
          <Button title={submitLabel} onPress={submit} loading={loading} style={styles.actionBtn} />
        </View>
      ) : (
        <Button title={submitLabel} onPress={submit} loading={loading} style={styles.submit} />
      )}
    </>
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14 },
});
