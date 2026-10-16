import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { decodePolyline } from '../utils/polyline';

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const MAX_INTERMEDIARIOS = 25;

const waypoint = ({ latitude, longitude }) => ({ location: { latLng: { latitude, longitude } } });

/**
 * Busca o caminho real pelas ruas passando pelos pontos na ordem informada.
 * @param {{ latitude: number, longitude: number }[]} pontos origem, paradas intermediárias e destino
 * @returns {Promise<{ coordenadas: { latitude: number, longitude: number }[], distanciaMetros: number, duracaoSegundos: number }>}
 */
export async function buscarCaminhoPelasRuas(pontos) {
  const { apiKey, androidCertSha1 } = Constants.expoConfig?.extra?.googleMaps ?? {};
  if (typeof apiKey !== 'string' || !apiKey) throw new Error('GOOGLE_MAPS_API_KEY não configurada');
  if (pontos.length < 2) throw new Error('São necessários ao menos 2 pontos');
  if (pontos.length - 2 > MAX_INTERMEDIARIOS) {
    throw new Error(`A Routes API aceita no máximo ${MAX_INTERMEDIARIOS} paradas intermediárias`);
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
  };
  const androidPackage = Constants.expoConfig?.android?.package;
  if (Platform.OS === 'android' && typeof androidCertSha1 === 'string' && androidCertSha1) {
    if (typeof androidPackage === 'string') headers['X-Android-Package'] = androidPackage;
    headers['X-Android-Cert'] = androidCertSha1;
  }

  const response = await fetch(ROUTES_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      origin: waypoint(pontos[0]),
      destination: waypoint(pontos[pontos.length - 1]),
      intermediates: pontos.slice(1, -1).map(waypoint),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      languageCode: 'pt-BR',
      units: 'METRIC',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `Routes API respondeu ${response.status}`);
  }

  const rota = data.routes?.[0];
  if (!rota?.polyline?.encodedPolyline) throw new Error('Nenhuma rota encontrada');

  return {
    coordenadas: decodePolyline(rota.polyline.encodedPolyline),
    distanciaMetros: rota.distanceMeters ?? 0,
    duracaoSegundos: parseInt(rota.duration, 10) || 0,
  };
}
