import { colors } from '../constants/colors';

/** Rótulo, ícone e cores de cada `StatusPresencaEnum` da core-api. */
export const STATUS_PRESENCA_INFO = {
  PRESENTE: { rotulo: 'Presente', icone: 'checkmark-circle', cor: colors.success, fundo: colors.successBg },
  AUSENTE: { rotulo: 'Ausente', icone: 'close-circle', cor: colors.error, fundo: colors.errorBg },
  ENTREGUE: { rotulo: 'Entregue', icone: 'flag', cor: colors.info, fundo: colors.infoBg },
};

export const infoPresenca = (status) => STATUS_PRESENCA_INFO[status] ?? STATUS_PRESENCA_INFO.AUSENTE;
