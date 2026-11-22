const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarAuth(respostas = []) {
  const chamadas = [];
  let indice = 0;
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
        headers: opcoes.headers,
        body: opcoes.body ? JSON.parse(opcoes.body) : undefined,
      });
      const atual = respostas[indice++] ?? { status: 200, body: 'OK' };
      return {
        ok: atual.status >= 200 && atual.status < 300,
        status: atual.status,
        text: async () => atual.body,
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

  const auth = new vm.SourceTextModule(ler('auth.js'), { context });
  await auth.link((nome) => {
    if (nome === './api') return api;
    throw new Error(`Import inesperado em auth.js: ${nome}`);
  });
  await auth.evaluate();

  return { auth: auth.namespace, chamadas };
}

test('solicitarRecuperacaoSenha e redefinirSenha chamam endpoints publicos sem Authorization', async () => {
  const { auth, chamadas } = await carregarAuth([
    { status: 200, body: 'Se o e-mail estiver cadastrado, enviamos um código de recuperação.' },
    { status: 200, body: 'Senha redefinida com sucesso!' },
  ]);

  await auth.solicitarRecuperacaoSenha('motorista@safeway.com');
  await auth.redefinirSenha({
    email: 'motorista@safeway.com',
    code: '123456',
    newPassword: 'Nova@123',
  });

  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[0].method, 'POST');
  assert.equal(chamadas[0].url, 'http://localhost:8080/auth/forgot-password');
  assert.equal(chamadas[0].headers.Authorization, undefined);
  assert.deepEqual(chamadas[0].body, { email: 'motorista@safeway.com' });

  assert.equal(chamadas[1].method, 'POST');
  assert.equal(chamadas[1].url, 'http://localhost:8080/auth/reset-password');
  assert.equal(chamadas[1].headers.Authorization, undefined);
  assert.deepEqual(chamadas[1].body, {
    email: 'motorista@safeway.com',
    code: '123456',
    newPassword: 'Nova@123',
  });
});

test('redefinirSenha propaga erro 400 quando codigo e invalido ou expirado', async () => {
  const { auth } = await carregarAuth([
    { status: 400, body: 'Código de recuperação inválido ou expirado.' },
  ]);

  await assert.rejects(
    auth.redefinirSenha({ email: 'motorista@safeway.com', code: '000000', newPassword: 'Nova@123' }),
    (erro) => erro.status === 400 && /inválido ou expirado/i.test(erro.message)
  );
});
