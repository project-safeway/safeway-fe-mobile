import { reindexTrajeto } from './trajeto';

/**
 * Extrai coordenadas numéricas válidas de uma parada do trajeto.
 * @param {{ address?: { latitude?: number|string, longitude?: number|string } }} parada
 * @returns {{ lat: number, lng: number } | null}
 */
export function coordenadaDaParada(parada) {
  const lat = parseFloat(parada?.address?.latitude);
  const lng = parseFloat(parada?.address?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function coordenadaValida(loc) {
  if (!loc) return null;
  const lat = Number(loc.latitude ?? loc.lat);
  const lng = Number(loc.longitude ?? loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * Monta o corpo de POST /routes/optimize conforme RouteRequest da core-api.
 * Nota: o DTO do back-end usa a grafia `intialLocation` (sem o segundo "i").
 * @param {object[]} trajeto
 * @param {{ tipoViagem?: string, veiculoId?: string, localizacaoAtual?: { latitude: number, longitude: number } | null }} [opcoes]
 * @returns {{ payload?: object, erro?: string, paradasSemCoordenada?: string[] }}
 */
export function montarRequisicaoOtimizacao(
  trajeto = [],
  { tipoViagem = 'TO_SCHOOL', veiculoId = 'vehicle-1', localizacaoAtual = null } = {}
) {
  if (trajeto.length < 2) {
    return { erro: 'Adicione pelo menos 2 paradas no trajeto para otimizar a rota.' };
  }

  const semCoordenada = [];
  const pontos = trajeto.map((parada, index) => {
    const location = coordenadaDaParada(parada);
    if (!location) semCoordenada.push(parada.nome || `Parada ${index + 1}`);
    return {
      parada,
      stopPoint: {
        id: parada.key,
        location,
        order: index + 1,
      },
    };
  });

  if (semCoordenada.length > 0) {
    return {
      erro: `As seguintes paradas estão sem coordenadas de endereço: ${semCoordenada.join(', ')}.`,
      paradasSemCoordenada: semCoordenada,
    };
  }

  const gps = coordenadaValida(localizacaoAtual);
  const primeiraEscola = pontos.find((p) => p.parada.tipo === 'escola')?.stopPoint.location ?? null;
  const ultimaEscola =
    [...pontos].reverse().find((p) => p.parada.tipo === 'escola')?.stopPoint.location ?? null;
  const ultimoAluno =
    [...pontos].reverse().find((p) => p.parada.tipo === 'aluno')?.stopPoint.location ?? null;
  const primeiroPonto = pontos[0].stopPoint.location;
  const ultimoPonto = pontos[pontos.length - 1].stopPoint.location;

  let intialLocation;
  let finalLocation;
  if (tipoViagem === 'FROM_SCHOOL') {
    intialLocation = primeiraEscola ?? gps ?? primeiroPonto;
    finalLocation = gps ?? ultimoAluno ?? ultimoPonto;
  } else {
    intialLocation = gps ?? primeiroPonto;
    finalLocation = ultimaEscola ?? ultimoPonto;
  }

  return {
    payload: {
      vehicle: {
        id: String(veiculoId || 'vehicle-1'),
        intialLocation,
        finalLocation,
      },
      stoppingPoint: pontos.map((p) => p.stopPoint),
      mustOptimizeOrder: true,
    },
  };
}

/**
 * Reordena o trajeto conforme `stops` retornados por POST /routes/optimize.
 * @param {object[]} trajeto
 * @param {{ totalDistance?: number, totalTime?: number, stops?: { stopId: string }[] }} resposta
 */
export function aplicarOrdemOtimizada(trajeto, resposta) {
  const porChave = new Map((trajeto || []).map((item) => [item.key, item]));
  const ordenados = [];
  const usados = new Set();

  for (const stop of resposta?.stops || []) {
    const item = porChave.get(stop.stopId);
    if (item && !usados.has(item.key)) {
      ordenados.push(item);
      usados.add(item.key);
    }
  }

  for (const item of trajeto || []) {
    if (!usados.has(item.key)) ordenados.push(item);
  }

  return {
    trajetoOtimizado: reindexTrajeto(ordenados),
    distanciaMetros: Number.isFinite(resposta?.totalDistance) ? resposta.totalDistance : null,
    duracaoSegundos: Number.isFinite(resposta?.totalTime) ? resposta.totalTime : null,
  };
}
