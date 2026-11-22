const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarUtils() {
  const context = vm.createContext({});
  const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'utils', arquivo), 'utf8');

  const trajeto = new vm.SourceTextModule(ler('trajeto.js'), { context });
  await trajeto.link(() => {
    throw new Error('Import inesperado em trajeto.js');
  });
  await trajeto.evaluate();

  const otimizacao = new vm.SourceTextModule(ler('otimizacaoRota.js'), { context });
  await otimizacao.link((nome) => {
    if (nome === './trajeto') return trajeto;
    throw new Error(`Import inesperado em otimizacaoRota.js: ${nome}`);
  });
  await otimizacao.evaluate();

  return otimizacao.namespace;
}

async function carregarServicoItinerarios() {
  const chamadas = [];
  const context = vm.createContext({
    FormData,
    AbortController,
    setTimeout,
    clearTimeout,
    console: { warn: () => {} },
    fetch: async (url, opcoes) => {
      chamadas.push({ url, method: opcoes.method, body: JSON.parse(opcoes.body), headers: opcoes.headers });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ totalDistance: 4500, totalTime: 600, stops: [] }),
      };
    },
  });

  const constants = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', { expoConfig: { extra: { api: { host: 'localhost' } } } });
  }, { context });
  const router = new vm.SyntheticModule(['router'], function () {
    this.setExport('router', { replace: () => {} });
  }, { context });

  const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'services', arquivo), 'utf8');
  const api = new vm.SourceTextModule(ler('api.js'), { context });
  await api.link((nome) => {
    if (nome === 'expo-constants') return constants;
    if (nome === 'expo-router') return router;
    throw new Error(`Import inesperado em api.js: ${nome}`);
  });
  await api.evaluate();

  const itinerarios = new vm.SourceTextModule(ler('itinerarios.js'), { context });
  await itinerarios.link((nome) => {
    if (nome === './api') return api;
    throw new Error(`Import inesperado em itinerarios.js: ${nome}`);
  });
  await itinerarios.evaluate();

  api.namespace.definirToken('token-teste');
  return { itinerarios: itinerarios.namespace, chamadas };
}

const TRAJETO = [
  { key: 'aluno-1', id: '1', tipo: 'aluno', nome: 'Enzo', address: { latitude: '-23.6327', longitude: '-46.5565' }, ordemGlobal: 1 },
  { key: 'aluno-2', id: '2', tipo: 'aluno', nome: 'Valentina', address: { latitude: '-23.6200', longitude: '-46.5600' }, ordemGlobal: 2 },
  { key: 'escola-9', id: '9', tipo: 'escola', nome: 'EMEF Centro', address: { latitude: '-23.6368', longitude: '-46.5542' }, ordemGlobal: 3 },
];

test('monta RouteRequest para TO_SCHOOL usando GPS como inicio e escola como destino final', async () => {
  const { montarRequisicaoOtimizacao } = await carregarUtils();

  const res = JSON.parse(
    JSON.stringify(
      montarRequisicaoOtimizacao(TRAJETO, {
        tipoViagem: 'TO_SCHOOL',
        veiculoId: 'route-1',
        localizacaoAtual: { latitude: -23.61, longitude: -46.55 },
      })
    )
  );

  assert.equal(res.erro, undefined);
  assert.deepEqual(res.payload.vehicle, {
    id: 'route-1',
    intialLocation: { lat: -23.61, lng: -46.55 },
    finalLocation: { lat: -23.6368, lng: -46.5542 },
  });
  assert.equal(res.payload.mustOptimizeOrder, true);
  assert.equal(res.payload.stoppingPoint.length, 3);
  assert.equal(res.payload.stoppingPoint[0].id, 'aluno-1');
});

test('monta RouteRequest para FROM_SCHOOL iniciando na escola', async () => {
  const { montarRequisicaoOtimizacao } = await carregarUtils();

  const res = JSON.parse(
    JSON.stringify(
      montarRequisicaoOtimizacao(TRAJETO, {
        tipoViagem: 'FROM_SCHOOL',
        veiculoId: 'route-2',
      })
    )
  );

  assert.deepEqual(res.payload.vehicle.intialLocation, { lat: -23.6368, lng: -46.5542 });
  assert.deepEqual(res.payload.vehicle.finalLocation, { lat: -23.62, lng: -46.56 });
});

test('bloqueia otimizacao quando ha menos de 2 paradas ou endereco sem coordenadas', async () => {
  const { montarRequisicaoOtimizacao } = await carregarUtils();

  assert.ok(montarRequisicaoOtimizacao([TRAJETO[0]]).erro);

  const semCoord = [TRAJETO[0], { key: 'aluno-3', id: '3', tipo: 'aluno', nome: 'Lucas', address: {} }];
  const res = montarRequisicaoOtimizacao(semCoord);
  assert.match(res.erro, /Lucas/);
});

test('aplica ordem otimizada da API e reindexa ordemGlobal sem perder paradas', async () => {
  const { aplicarOrdemOtimizada } = await carregarUtils();

  const { trajetoOtimizado, distanciaMetros, duracaoSegundos } = aplicarOrdemOtimizada(TRAJETO, {
    totalDistance: 5420,
    totalTime: 780,
    stops: [{ stopId: 'aluno-2' }, { stopId: 'aluno-1' }, { stopId: 'escola-9' }],
  });

  assert.deepEqual(
    Array.from(trajetoOtimizado, (p) => [p.key, p.ordemGlobal]),
    [
      ['aluno-2', 1],
      ['aluno-1', 2],
      ['escola-9', 3],
    ]
  );
  assert.equal(distanciaMetros, 5420);
  assert.equal(duracaoSegundos, 780);
});

test('otimizarRota chama POST /routes/optimize autenticado', async () => {
  const { itinerarios, chamadas } = await carregarServicoItinerarios();

  const resp = await itinerarios.otimizarRota({ mustOptimizeOrder: true });

  assert.equal(resp.totalDistance, 4500);
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].method, 'POST');
  assert.equal(chamadas[0].url, 'http://localhost:8080/routes/optimize');
  assert.equal(chamadas[0].headers.Authorization, 'Bearer token-teste');
});
