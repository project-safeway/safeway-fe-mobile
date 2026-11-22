const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarUtils() {
  const context = vm.createContext({});
  const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'utils', arquivo), 'utf8');

  const formatters = new vm.SourceTextModule(ler('formatters.js'), { context });
  await formatters.link(() => {
    throw new Error('Import inesperado em formatters.js');
  });
  await formatters.evaluate();

  const mensalidadeForm = new vm.SourceTextModule(ler('mensalidadeForm.js'), { context });
  await mensalidadeForm.link((nome) => {
    if (nome === './formatters') return formatters;
    throw new Error(`Import inesperado em mensalidadeForm.js: ${nome}`);
  });
  await mensalidadeForm.evaluate();

  return mensalidadeForm.namespace;
}

async function carregarServicoFinanceiro() {
  const chamadas = [];
  const context = vm.createContext({
    FormData,
    AbortController,
    setTimeout,
    clearTimeout,
    console: { warn: () => {} },
    fetch: async (url, opcoes) => {
      chamadas.push({
        url,
        method: opcoes.method,
        body: opcoes.body ? JSON.parse(opcoes.body) : undefined,
        headers: opcoes.headers,
      });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'm-1', valorMensalidade: 400 }),
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

  const financeiro = new vm.SourceTextModule(ler('financeiro.js'), { context });
  await financeiro.link((nome) => {
    if (nome === './api') return api;
    throw new Error(`Import inesperado em financeiro.js: ${nome}`);
  });
  await financeiro.evaluate();

  api.namespace.definirToken('token-teste');
  return { financeiro: financeiro.namespace, chamadas };
}

test('valida desconto positivo e estritamente menor que o valor atual', async () => {
  const { validarDesconto } = await carregarUtils();

  assert.ok(validarDesconto('', 450).erro);
  assert.ok(validarDesconto('0,00', 450).erro);
  assert.ok(validarDesconto('450,00', 450).erro);
  assert.ok(validarDesconto('500,00', 450).erro);

  const ok = validarDesconto('50,00', 450);
  assert.equal(ok.erro, null);
  assert.equal(ok.valorDesconto, 50);
});

test('sugere vencimento ajustando dia 31 para ultimo dia de fevereiro', async () => {
  const { sugerirVencimentoPorDia } = await carregarUtils();

  assert.equal(sugerirVencimentoPorDia(31, new Date(2026, 1, 10)), '28/02/2026');
  assert.equal(sugerirVencimentoPorDia(5, new Date(2026, 10, 22)), '05/11/2026');
});

test('valida e monta payload de mensalidade PENDENTE e PAGO conforme CriarMensalidadeUseCaseImpl', async () => {
  const { validarNovaMensalidade, montarPayloadMensalidade } = await carregarUtils();

  const pendente = {
    alunoId: 'aluno-1',
    valor: '450,00',
    dataVencimento: '10/11/2026',
    status: 'PENDENTE',
    valorPago: '450,00',
    dataPagamento: '10/11/2026',
  };
  assert.equal(Object.keys(validarNovaMensalidade(pendente)).length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(montarPayloadMensalidade(pendente))), {
    alunoId: 'aluno-1',
    valorMensalidade: 450,
    dataVencimento: '2026-11-10',
    status: 'PENDENTE',
    valorPago: null,
    dataPagamento: null,
  });

  const pagoInvalido = { ...pendente, status: 'PAGO', valorPago: '500,00', dataPagamento: '' };
  const errosPago = validarNovaMensalidade(pagoInvalido);
  assert.ok(errosPago.valorPago);
  assert.ok(errosPago.dataPagamento);

  const pagoValido = { ...pendente, status: 'PAGO', valorPago: '400,00', dataPagamento: '12/11/2026' };
  assert.equal(Object.keys(validarNovaMensalidade(pagoValido)).length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(montarPayloadMensalidade(pagoValido))), {
    alunoId: 'aluno-1',
    valorMensalidade: 450,
    dataVencimento: '2026-11-10',
    status: 'PAGO',
    valorPago: 400,
    dataPagamento: '2026-11-12',
  });
});

test('servicos de desconto e criacao chamam os endpoints corretos da API financeira', async () => {
  const { financeiro, chamadas } = await carregarServicoFinanceiro();

  await financeiro.aplicarDescontoMensalidade('m-1', 50);
  await financeiro.criarMensalidade({
    alunoId: 'aluno-1',
    valorMensalidade: 450,
    dataVencimento: '2026-11-10',
    status: 'PENDENTE',
    valorPago: null,
    dataPagamento: null,
  });

  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[0].method, 'PATCH');
  assert.equal(chamadas[0].url, 'http://localhost:8081/api/v1/mensalidades/desconto/m-1?valorDesconto=50');
  assert.equal(chamadas[0].body, undefined);

  assert.equal(chamadas[1].method, 'POST');
  assert.equal(chamadas[1].url, 'http://localhost:8081/api/v1/mensalidades/criar');
  assert.equal(chamadas[1].body.alunoId, 'aluno-1');
});
