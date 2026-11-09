const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function cliente(status = 204, resposta = '') {
  const chamadas = [];
  const redirecionamentos = [];
  class FormDataMobile {
    campos = [];
    append(nome, valor) {
      this.campos.push([nome, valor]);
    }
  }
  const context = vm.createContext({
    FormData: FormDataMobile,
    AbortController,
    setTimeout,
    clearTimeout,
    console: { warn() {} },
    fetch: async (url, opcoes) => {
      chamadas.push({ url, ...opcoes });
      return { ok: status >= 200 && status < 300, status, text: async () => resposta };
    },
  });
  const constants = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', { expoConfig: { extra: { api: { host: 'localhost' } } } });
  }, { context });
  const router = new vm.SyntheticModule(['router'], function () {
    this.setExport('router', { replace: (rota) => redirecionamentos.push(rota) });
  }, { context });
  const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'services', arquivo), 'utf8');
  const api = new vm.SourceTextModule(ler('api.js'), { context });
  await api.link((nome) => {
    if (nome === 'expo-constants') return constants;
    if (nome === 'expo-router') return router;
    throw new Error(`Import inesperado: ${nome}`);
  });
  await api.evaluate();
  const usuario = new vm.SourceTextModule(ler('usuario.js'), { context });
  await usuario.link((nome) => {
    if (nome === './api') return api;
    throw new Error(`Import inesperado: ${nome}`);
  });
  await usuario.evaluate();
  api.namespace.definirToken('token-teste');
  return { api: api.namespace, usuario: usuario.namespace, chamadas, redirecionamentos };
}

test('envia arquivo multipart autenticado sem forcar o Content-Type ou serializar o arquivo', async () => {
  const { usuario, chamadas } = await cliente();
  const asset = { uri: 'file:///photo.png', fileName: 'photo.png', mimeType: 'image/png' };

  assert.equal(await usuario.atualizarFotoUsuario(asset), null);

  const chamada = chamadas[0];
  assert.equal(chamada.url, 'http://localhost:8080/users/me/photo');
  assert.equal(chamada.method, 'PUT');
  assert.equal(chamada.headers.Authorization, 'Bearer token-teste');
  assert.equal(chamada.headers['Content-Type'], undefined);
  assert.equal(chamada.body.campos[0][0], 'file');
  assert.equal(chamada.body.campos[0][1].uri, asset.uri);
  assert.equal(chamada.body.campos[0][1].type, 'image/png');
  assert.equal(chamada.body.campos[0][1].name, 'photo.png');
});

test('preserva envio JSON dos demais dados do perfil', async () => {
  const { usuario, chamadas } = await cliente(200, '{"name":"Motorista"}');

  const resultado = await usuario.atualizarUsuario({ name: 'Motorista' });

  assert.equal(resultado.name, 'Motorista');
  assert.equal(chamadas[0].headers['Content-Type'], 'application/json');
  assert.equal(chamadas[0].body, '{"name":"Motorista"}');
});

test('carrega imagem com token no header e nao na URL', async () => {
  const { api } = await cliente();

  const fonte = api.fonteImagemAutenticada('/users/me/photo', 123);

  assert.equal(fonte.uri, 'http://localhost:8080/users/me/photo?v=123');
  assert.equal(fonte.headers.Authorization, 'Bearer token-teste');
  assert.equal(fonte.cache, 'reload');
});

test('persiste remocao de foto no backend', async () => {
  const { usuario, chamadas } = await cliente();

  assert.equal(await usuario.removerFotoUsuario(), null);

  assert.equal(chamadas[0].method, 'DELETE');
  assert.equal(chamadas[0].headers.Authorization, 'Bearer token-teste');
  assert.equal(chamadas[0].url, 'http://localhost:8080/users/me/photo');
});

test('propaga rejeicao de tamanho sem retornar sucesso', async () => {
  const { usuario } = await cliente(413, 'Photo must not exceed 5 MB');

  await assert.rejects(
    usuario.atualizarFotoUsuario({ uri: 'file:///photo.jpg' }),
    (erro) => erro.status === 413 && erro.message === 'Photo must not exceed 5 MB'
  );
});

test('upload com sessao expirada limpa token e redireciona ao login', async () => {
  const { api, usuario, redirecionamentos } = await cliente(401);

  await assert.rejects(usuario.atualizarFotoUsuario({ uri: 'file:///photo.jpg' }));

  assert.deepEqual(redirecionamentos, ['/login']);
  assert.equal(api.fonteImagemAutenticada('/users/me/photo', 123).headers.Authorization, undefined);
});
