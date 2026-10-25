import * as Location from 'expo-location';

const IDADE_MAXIMA_MS = 2 * 60 * 1000;
const TEMPO_LIMITE_MS = 2500;

const comTempoLimite = (promessa, ms) =>
  Promise.race([promessa, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

const paraLocalizacao = (posicao) =>
  posicao ? { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude } : null;

/** 'granted' | 'denied' | 'undetermined' (sem pedir ao usuário). */
export async function statusPermissaoLocalizacao() {
  try {
    return (await Location.getForegroundPermissionsAsync()).status;
  } catch {
    return 'undetermined';
  }
}

export async function pedirPermissaoLocalizacao() {
  try {
    return (await Location.requestForegroundPermissionsAsync()).status;
  } catch {
    return 'denied';
  }
}

/**
 * Posição atual para mandar ao assistente sem segurar o envio:
 * usa a última posição recente; se não houver, espera o GPS no máximo ~2,5 s. Sem permissão ou sinal → null.
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
export async function obterLocalizacaoRapida() {
  try {
    if ((await statusPermissaoLocalizacao()) !== 'granted') return null;
    const recente = await Location.getLastKnownPositionAsync({ maxAge: IDADE_MAXIMA_MS });
    if (recente) return paraLocalizacao(recente);
    const atual = await comTempoLimite(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
      TEMPO_LIMITE_MS
    );
    return paraLocalizacao(atual) ?? paraLocalizacao(await Location.getLastKnownPositionAsync());
  } catch (error) {
    console.warn('[localizacao] indisponível:', error.message);
    return null;
  }
}
