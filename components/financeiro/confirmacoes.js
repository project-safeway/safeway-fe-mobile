import { Alert } from 'react-native';
import { formatCurrency } from '../../utils/formatters';

export function confirmarPagamentoMensalidade(mensalidade, pagar) {
  Alert.alert(
    'Confirmar pagamento',
    `Deseja marcar a mensalidade de ${mensalidade.nomeAluno} (${formatCurrency(mensalidade.valorMensalidade)}) como paga?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim, marcar como paga', onPress: () => pagar(mensalidade.id) },
    ]
  );
}

export function confirmarCancelamentoMensalidade(mensalidade, cancelar) {
  Alert.alert(
    'Cancelar mensalidade',
    `Tem certeza que deseja cancelar a mensalidade de ${mensalidade.nomeAluno} (${formatCurrency(mensalidade.valorMensalidade)})? Esta ação não poderá ser desfeita.`,
    [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Sim, cancelar', style: 'destructive', onPress: () => cancelar(mensalidade.id) },
    ]
  );
}

/** Ações de uma mensalidade em aberto (pendente ou atrasada). */
export function acoesMensalidade(mensalidade, pagar, cancelar) {
  Alert.alert(mensalidade.nomeAluno, `${formatCurrency(mensalidade.valorMensalidade)}`, [
    { text: 'Voltar', style: 'cancel' },
    { text: 'Cancelar mensalidade', style: 'destructive', onPress: () => confirmarCancelamentoMensalidade(mensalidade, cancelar) },
    { text: 'Marcar como paga', onPress: () => confirmarPagamentoMensalidade(mensalidade, pagar) },
  ]);
}

export function confirmarExclusaoPagamento(pagamento, excluir, onExcluido) {
  Alert.alert(
    'Confirmar exclusão',
    `Tem certeza que deseja excluir "${pagamento.descricao}"? Esta ação não poderá ser desfeita.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, excluir',
        style: 'destructive',
        onPress: async () => {
          await excluir(pagamento.id);
          onExcluido?.();
        },
      },
    ]
  );
}
