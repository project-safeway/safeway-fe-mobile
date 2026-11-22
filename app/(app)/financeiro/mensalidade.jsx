import { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { BackHeader } from '../../../components/BackHeader';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { EstadoCarregamento } from '../../../components/EstadoCarregamento';
import { colors } from '../../../constants/colors';
import { useFinanceiro } from '../../../contexts/FinanceiroContext';
import { useCarregar } from '../../../hooks/useCarregar';
import { listarAlunos } from '../../../services/alunos';
import { isoToBR, maskDate, maskMoney } from '../../../utils/formatters';
import { hojeISO } from '../../../utils/financeiro';
import {
  montarPayloadMensalidade,
  sugerirVencimentoPorDia,
  validarNovaMensalidade,
} from '../../../utils/mensalidadeForm';

const STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'PAGO', label: 'Pago' },
];

export default function NovaMensalidadeScreen() {
  const { criarMensalidade } = useFinanceiro();
  const { dados: alunos, erro: erroAlunos, recarregar } = useCarregar(listarAlunos);

  const [alunoId, setAlunoId] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState(isoToBR(hojeISO()));
  const [status, setStatus] = useState('PENDENTE');
  const [valorPago, setValorPago] = useState('');
  const [dataPagamento, setDataPagamento] = useState(isoToBR(hojeISO()));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const opcoesAlunos = useMemo(
    () =>
      (alunos || []).map((aluno) => ({
        value: aluno.id,
        label: aluno.school?.name ? `${aluno.name} (${aluno.school.name})` : aluno.name,
      })),
    [alunos]
  );

  const selecionarAluno = (id) => {
    setAlunoId(id);
    const aluno = (alunos || []).find((a) => a.id === id);
    if (!aluno) return;
    if (aluno.monthlyFee !== null && aluno.monthlyFee !== undefined) {
      const formatado = maskMoney(Number(aluno.monthlyFee).toFixed(2));
      setValor(formatado);
      if (status === 'PAGO') setValorPago(formatado);
    }
    const sugerida = sugerirVencimentoPorDia(aluno.dueDate);
    if (sugerida) setDataVencimento(sugerida);
  };

  const alterarStatus = (novoStatus) => {
    setStatus(novoStatus);
    if (novoStatus === 'PAGO' && !valorPago && valor) {
      setValorPago(valor);
    }
  };

  const salvar = async () => {
    const estado = { alunoId, valor, dataVencimento, status, valorPago, dataPagamento };
    const next = validarNovaMensalidade(estado);
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const criada = await criarMensalidade(montarPayloadMensalidade(estado));
    setLoading(false);
    if (criada) router.back();
  };

  return (
    <KeyboardScreen edges={['top']}>
      <BackHeader
        title="Nova Mensalidade"
        subtitle="Crie uma cobrança avulsa para um aluno"
      />

      {!alunos ? (
        <EstadoCarregamento erro={erroAlunos} onTentarNovamente={recarregar} />
      ) : alunos.length === 0 ? (
        <Text style={styles.hint}>
          Nenhum aluno cadastrado. Cadastre um aluno antes de gerar uma mensalidade.
        </Text>
      ) : (
        <>
          <Select
            label="Aluno *"
            placeholder="Selecione o aluno"
            value={alunoId}
            options={opcoesAlunos}
            onChange={selecionarAluno}
            error={errors.alunoId}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Valor (R$) *"
                placeholder="0,00"
                value={valor}
                onChangeText={(v) => setValor(maskMoney(v))}
                keyboardType="number-pad"
                error={errors.valor}
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Vencimento *"
                placeholder="DD/MM/AAAA"
                value={dataVencimento}
                onChangeText={(v) => setDataVencimento(maskDate(v))}
                keyboardType="number-pad"
                error={errors.dataVencimento}
              />
            </View>
          </View>

          <Select
            label="Status *"
            value={status}
            options={STATUS_OPTIONS}
            onChange={alterarStatus}
          />

          {status === 'PAGO' ? (
            <View style={styles.row}>
              <View style={styles.col}>
                <Input
                  label="Valor Pago (R$) *"
                  placeholder="0,00"
                  value={valorPago}
                  onChangeText={(v) => setValorPago(maskMoney(v))}
                  keyboardType="number-pad"
                  error={errors.valorPago}
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Data do Pagamento *"
                  placeholder="DD/MM/AAAA"
                  value={dataPagamento}
                  onChangeText={(v) => setDataPagamento(maskDate(v))}
                  keyboardType="number-pad"
                  error={errors.dataPagamento}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={styles.actionBtn} />
            <Button title="Criar Mensalidade" onPress={salvar} loading={loading} style={styles.actionBtn} />
          </View>
        </>
      )}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 16 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 14 },
});
