import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { EstadoCarregamento } from './EstadoCarregamento';
import { colors } from '../constants/colors';
import { maskCEP, maskDate, maskMoney, maskPhone } from '../utils/formatters';
import {
  criarEstadoInicialAluno,
  montarPayloadAluno,
  responsaveisParaSalvar,
  validarFormularioAluno,
} from '../utils/alunoForm';

/**
 * Formulário de aluno (cadastro e edição), com o payload no formato da API core.
 * @param {Object} props
 * @param {object} [props.initialValues] StudentResponse
 * @param {object[] | null} props.escolas SchoolResponse[]
 * @param {Error | null} [props.erroEscolas]
 * @param {() => void} [props.onRecarregarEscolas]
 * @param {string} props.submitLabel
 * @param {(dados: { payload: object, alteracoesResponsaveis: { id: string | null, payload: object }[] }) => Promise<void> | void} props.onSubmit
 * @param {() => void} [props.onCancel] exibe o botão Cancelar ao lado do envio
 */
export function AlunoForm({
  initialValues,
  escolas,
  erroEscolas,
  onRecarregarEscolas,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [estado, setEstado] = useState(() => criarEstadoInicialAluno(initialValues));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setCampo = (key, value) => setEstado((prev) => ({ ...prev, [key]: value }));

  const setResp = (index, key, value) =>
    setEstado((prev) => ({
      ...prev,
      responsaveis: prev.responsaveis.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    }));

  const setEnd = (index, key, value) =>
    setEstado((prev) => ({
      ...prev,
      responsaveis: prev.responsaveis.map((r, i) =>
        i === index ? { ...r, endereco: { ...r.endereco, [key]: value } } : r
      ),
    }));

  const submit = async () => {
    const next = validarFormularioAluno(estado);
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = montarPayloadAluno(estado);
    const alteracoesResponsaveis = initialValues
      ? responsaveisParaSalvar(initialValues.guardians, estado.responsaveis)
      : [];

    setLoading(true);
    try {
      await onSubmit({ payload, alteracoesResponsaveis });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={styles.section}>Dados do Aluno</Text>
      <Input
        label="Nome do Aluno *"
        placeholder="Digite o nome completo"
        value={estado.nome}
        onChangeText={(v) => setCampo('nome', v)}
        error={errors.nome}
      />
      <Input
        label="Data de Nascimento"
        placeholder="DD/MM/AAAA"
        value={estado.nascimento}
        onChangeText={(v) => setCampo('nascimento', maskDate(v))}
        keyboardType="number-pad"
        error={errors.nascimento}
      />
      <Input
        label="Professor *"
        placeholder="Nome do professor"
        value={estado.professor}
        onChangeText={(v) => setCampo('professor', v)}
        error={errors.professor}
      />

      <Text style={styles.label}>Escola *</Text>
      {!escolas ? (
        <EstadoCarregamento erro={erroEscolas} onTentarNovamente={onRecarregarEscolas} />
      ) : escolas.length === 0 ? (
        <Text style={styles.hint}>Nenhuma escola cadastrada. Cadastre uma escola antes do aluno.</Text>
      ) : (
        <View style={styles.chips}>
          {escolas.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.chip, estado.escolaId === e.id && styles.chipActive]}
              onPress={() => setCampo('escolaId', e.id)}
            >
              <Text style={[styles.chipText, estado.escolaId === e.id && styles.chipTextActive]}>
                {e.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.escolaId ? <Text style={styles.error}>{errors.escolaId}</Text> : null}

      <Input
        label="Série"
        placeholder="Ex: 1"
        value={estado.serie}
        onChangeText={(v) => setCampo('serie', v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
      />
      <Input
        label="Sala"
        placeholder="Ex: A"
        value={estado.sala}
        onChangeText={(v) => setCampo('sala', v)}
      />
      <Input
        label="Mensalidade (R$) *"
        placeholder="0,00"
        value={estado.mensalidade}
        onChangeText={(v) => setCampo('mensalidade', maskMoney(v))}
        keyboardType="number-pad"
        error={errors.mensalidade}
      />
      <Input
        label="Dia do Vencimento *"
        placeholder="5"
        value={estado.vencimentoDia}
        onChangeText={(v) => setCampo('vencimentoDia', v.replace(/\D/g, '').slice(0, 2))}
        keyboardType="number-pad"
        error={errors.vencimentoDia}
      />

      {estado.responsaveis.map((responsavel, index) => {
        const prefix = `resp_${index}_`;
        const titulo =
          estado.responsaveis.length > 1 ? `Responsável ${index + 1} *` : 'Responsável *';
        return (
          <View key={responsavel.id ?? index}>
            <Text style={styles.section}>{titulo}</Text>
            <Card>
              <Input
                label="Nome *"
                placeholder="Nome completo"
                value={responsavel.nome}
                onChangeText={(v) => setResp(index, 'nome', v.slice(0, 45))}
                error={errors[`${prefix}nome`]}
              />
              <Input
                label="Telefone *"
                placeholder="(11) 99999-9999"
                value={responsavel.tel1}
                onChangeText={(v) => setResp(index, 'tel1', maskPhone(v))}
                keyboardType="phone-pad"
                error={errors[`${prefix}tel1`]}
              />
              <Input
                label="Telefone secundário"
                placeholder="(11) 99999-9999"
                value={responsavel.tel2}
                onChangeText={(v) => setResp(index, 'tel2', maskPhone(v))}
                keyboardType="phone-pad"
                error={errors[`${prefix}tel2`]}
              />
              <Input
                label="E-mail"
                placeholder="email@exemplo.com"
                value={responsavel.email}
                onChangeText={(v) => setResp(index, 'email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors[`${prefix}email`]}
              />
              <Input
                label="CEP *"
                placeholder="00000-000"
                value={responsavel.endereco.cep}
                onChangeText={(v) => setEnd(index, 'cep', maskCEP(v))}
                keyboardType="number-pad"
                error={errors[`${prefix}cep`]}
              />
              <Input
                label="Logradouro *"
                placeholder="Rua / Avenida"
                value={responsavel.endereco.logradouro}
                onChangeText={(v) => setEnd(index, 'logradouro', v)}
                error={errors[`${prefix}logradouro`]}
              />
              <Input
                label="Número *"
                placeholder="123"
                value={responsavel.endereco.numero}
                onChangeText={(v) => setEnd(index, 'numero', v.slice(0, 10))}
                error={errors[`${prefix}numero`]}
              />
              <Input
                label="Complemento"
                placeholder="Apartamento, bloco..."
                value={responsavel.endereco.complemento}
                onChangeText={(v) => setEnd(index, 'complemento', v)}
              />
              <Input
                label="Bairro *"
                placeholder="Bairro"
                value={responsavel.endereco.bairro}
                onChangeText={(v) => setEnd(index, 'bairro', v)}
                error={errors[`${prefix}bairro`]}
              />
              <Input
                label="Cidade *"
                placeholder="Cidade"
                value={responsavel.endereco.cidade}
                onChangeText={(v) => setEnd(index, 'cidade', v)}
                error={errors[`${prefix}cidade`]}
              />
              <Input
                label="UF *"
                placeholder="SP"
                value={responsavel.endereco.uf}
                onChangeText={(v) => setEnd(index, 'uf', v.toUpperCase().slice(0, 2))}
                autoCapitalize="characters"
                error={errors[`${prefix}uf`]}
              />
            </Card>
          </View>
        );
      })}

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
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 14 },
});
