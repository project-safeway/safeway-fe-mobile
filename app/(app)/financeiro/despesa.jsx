import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../../../components/BackHeader';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { KeyboardScreen } from '../../../components/KeyboardScreen';
import { confirmarExclusaoPagamento } from '../../../components/financeiro/confirmacoes';
import { colors } from '../../../constants/colors';
import { useFinanceiro } from '../../../contexts/FinanceiroContext';
import { brToISO, isoToBR, maskDate, maskMoney, parseMoney } from '../../../utils/formatters';
import { categoriaDaDespesa, hojeISO } from '../../../utils/financeiro';
import { isRequired } from '../../../utils/validators';

export default function DespesaFormScreen() {
  const { id } = useLocalSearchParams();
  const { pagamentos, criarPagamento, atualizarPagamento, excluirPagamento } = useFinanceiro();
  const editando = pagamentos.find((p) => String(p.id) === String(id));

  const [descricao, setDescricao] = useState(editando?.descricao ?? '');
  const [valor, setValor] = useState(editando ? maskMoney(Number(editando.valorPagamento).toFixed(2)) : '');
  const [data, setData] = useState(isoToBR(editando?.dataPagamento ?? hojeISO()));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categoria = descricao.trim() ? categoriaDaDespesa(descricao) : null;

  const salvar = async () => {
    const valorPagamento = parseMoney(valor);
    const dataPagamento = brToISO(data);
    const next = {};
    if (!isRequired(descricao)) next.descricao = 'Descrição é obrigatória';
    if (isNaN(valorPagamento) || valorPagamento <= 0) next.valor = 'Informe um valor maior que zero';
    if (!dataPagamento) next.data = 'Informe uma data válida (DD/MM/AAAA)';
    setErrors(next);
    if (Object.keys(next).length) return;

    const body = { dataPagamento, valorPagamento, descricao: descricao.trim() };
    setLoading(true);
    if (editando) await atualizarPagamento(editando.id, body);
    else await criarPagamento(body);
    setLoading(false);
    router.back();
  };

  return (
    <KeyboardScreen edges={['top']}>
      <BackHeader
        title={editando ? 'Editar Despesa' : 'Nova Despesa'}
        subtitle={editando ? 'Altere os dados do pagamento' : 'Registre um pagamento do transporte'}
      />

      <Input
        label="Descrição *"
        placeholder="Ex: Combustível (Van)"
        value={descricao}
        onChangeText={setDescricao}
        error={errors.descricao}
      />
      {categoria ? (
        <View style={styles.categoria}>
          <View style={[styles.categoriaDot, { backgroundColor: categoria.color }]} />
          <Text style={styles.categoriaText}>Categoria no gráfico: {categoria.label}</Text>
        </View>
      ) : null}

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
            label="Data *"
            placeholder="DD/MM/AAAA"
            value={data}
            onChangeText={(v) => setData(maskDate(v))}
            keyboardType="number-pad"
            error={errors.data}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Cancelar" variant="outline" onPress={() => router.back()} style={styles.actionBtn} />
        <Button
          title={editando ? 'Atualizar' : 'Registrar'}
          onPress={salvar}
          loading={loading}
          style={styles.actionBtn}
        />
      </View>

      {editando ? (
        <TouchableOpacity
          style={styles.excluir}
          onPress={() => confirmarExclusaoPagamento(editando, excluirPagamento, () => router.back())}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.excluirText}>Excluir despesa</Text>
        </TouchableOpacity>
      ) : null}
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  categoria: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 14 },
  categoriaDot: { width: 8, height: 8, borderRadius: 4 },
  categoriaText: { fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 14 },
  excluir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 10,
  },
  excluirText: { color: colors.error, fontWeight: '700', fontSize: 14 },
});
