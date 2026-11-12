const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

async function cliente(status = 204, resposta = '', { arquivoExiste = true, erroEnvio, erroGravacao, timeout = false } = {}) {
  const chamadas = [];
  const redirecionamentos = [];
  const avisos = [];
  const arquivos = [];
  class ArquivoMobile extends File {
    constructor(...partes) {
      const uri = partes.join('/');
      const nome = uri.split('/').pop();
      super([new Uint8Array([137, 80, 78, 71])], nome, { type: 'image/png' });
      this.uri = uri;
      this.exists = partes.length === 1 && arquivoExiste;
      arquivos.push(this);
    }
    create() {
      this.exists = true;
    }
    write(bytes) {
      if (erroGravacao) throw erroGravacao;
      this.gravados = Array.from(bytes);
    }
    delete() {
      this.exists = false;
    }
  }
  class FormDataMobile {
    campos = [];
    append(nome, valor, nomeArquivo) {
      if (nomeArquivo && valor instanceof Blob) {
        valor = new File([valor], nomeArquivo, { type: valor.type });
      }
      this.campos.push([nome, valor]);
    }
    entries() {
      return this.campos.values();
    }
  }
  let converter;
  const context = vm.createContext({
    FormData: FormDataMobile,
    Blob,
    Uint8Array,
    TextEncoder,
    AbortController,
    setTimeout: timeout ? (callback) => { callback(); return 0; } : setTimeout,
    clearTimeout: timeout ? () => {} : clearTimeout,
    console: { warn: (...args) => avisos.push(args) },
    fetch: async (url, opcoes) => {
      if (erroEnvio) throw erroEnvio;
      const multipart = opcoes.body instanceof FormDataMobile
        ? await converter.namespace.convertFormDataAsync(opcoes.body, 'test-boundary')
        : null;
      chamadas.push({ url, ...opcoes, multipart });
      return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => resposta,
        arrayBuffer: async () => new Uint8Array([137, 80, 78, 71]).buffer,
      };
    },
  });
  const blobUtils = new vm.SyntheticModule(['blobToArrayBufferAsync'], function () {
    this.setExport('blobToArrayBufferAsync', (blob) => blob.arrayBuffer());
  }, { context });
  const fonteConversor = fs.readFileSync(
    path.join(__dirname, '..', 'node_modules', 'expo', 'src', 'winter', 'fetch', 'convertFormData.ts'),
    'utf8'
  );
  converter = new vm.SourceTextModule(stripTypeScriptTypes(fonteConversor), { context });
  await converter.link((nome) => {
    if (nome === '../../utils/blobUtils') return blobUtils;
    throw new Error(`Import inesperado: ${nome}`);
  });
  await converter.evaluate();
  const constants = new vm.SyntheticModule(['default'], function () {
    this.setExport('default', { expoConfig: { extra: { api: { host: 'localhost' } } } });
  }, { context });
  const router = new vm.SyntheticModule(['router'], function () {
    this.setExport('router', { replace: (rota) => redirecionamentos.push(rota) });
  }, { context });
  const fileSystem = new vm.SyntheticModule(['File', 'Paths'], function () {
    this.setExport('File', ArquivoMobile);
    this.setExport('Paths', { cache: 'file:///cache' });
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
    if (nome === 'expo-file-system') return fileSystem;
    throw new Error(`Import inesperado: ${nome}`);
  });
  await usuario.evaluate();
  api.namespace.definirToken('token-teste');
  return { api: api.namespace, usuario: usuario.namespace, chamadas, redirecionamentos, avisos, arquivos };
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
  assert.ok(chamada.body.campos[0][1] instanceof Blob);
  assert.equal(chamada.body.campos[0][1].type, 'image/png');
  assert.equal(chamada.body.campos[0][1].name, 'photo.png');
  const multipart = new TextDecoder().decode(chamada.multipart.body);
  assert.match(multipart, /name="file"; filename="photo.png"/);
  assert.match(multipart, /content-type: image\/png/);
  assert.ok(chamada.multipart.body.includes(137));
});

test('arquivo local indisponivel pede nova selecao sem chamar a API', async () => {
  const { usuario, chamadas } = await cliente(204, '', { arquivoExiste: false });

  await assert.rejects(
    usuario.atualizarFotoUsuario({ uri: 'file:///photo.png' }),
    /selecione.*novamente/i
  );

  assert.equal(chamadas.length, 0);
});

test('timeout nao e apresentado como falha de conexao', async () => {
  const { usuario, avisos } = await cliente(204, '', {
    timeout: true,
    erroEnvio: new Error('Aborted'),
  });

  await assert.rejects(usuario.atualizarUsuario({ name: 'Motorista' }), /tempo limite/i);
  assert.equal(avisos.length, 1);
  assert.match(avisos[0][0], /PUT \/users\/me/);
});

test('preserva envio JSON dos demais dados do perfil', async () => {
  const { usuario, chamadas } = await cliente(200, '{"name":"Motorista"}');

  const resultado = await usuario.atualizarUsuario({ name: 'Motorista' });

  assert.equal(resultado.name, 'Motorista');
  assert.equal(chamadas[0].headers['Content-Type'], 'application/json');
  assert.equal(chamadas[0].body, '{"name":"Motorista"}');
});

test('baixa foto binaria com o token do cliente HTTP e entrega arquivo local para Image', async () => {
  const { usuario, chamadas } = await cliente(200);

  const arquivo = await usuario.carregarFotoUsuario();

  assert.equal(chamadas[0].url, 'http://localhost:8080/users/me/photo');
  assert.equal(chamadas[0].headers.Authorization, 'Bearer token-teste');
  assert.equal(chamadas[0].headers.Accept, 'image/jpeg, image/png');
  assert.match(arquivo.uri, /^file:\/\/\/cache\/perfil-/);
  assert.deepEqual(arquivo.gravados, [137, 80, 78, 71]);
  usuario.descartarFotoTemporaria(arquivo);
  assert.equal(arquivo.exists, false);
});

test('foto ausente retorna erro da API sem criar arquivo de cache', async () => {
  const { usuario, arquivos } = await cliente(404, 'Profile photo was not found');

  await assert.rejects(usuario.carregarFotoUsuario(), (erro) => erro.status === 404);

  assert.equal(arquivos.length, 0);
});

test('falha ao gravar foto remove o cache parcial e propaga o erro', async () => {
  const { usuario, arquivos } = await cliente(200, '', { erroGravacao: new Error('Cache indisponivel') });

  await assert.rejects(usuario.carregarFotoUsuario(), /Cache indisponivel/);

  assert.equal(arquivos.length, 1);
  assert.equal(arquivos[0].exists, false);
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
  const { api, usuario, redirecionamentos, chamadas } = await cliente(401);

  await assert.rejects(usuario.atualizarFotoUsuario({ uri: 'file:///photo.jpg' }));

  assert.deepEqual(redirecionamentos, ['/login']);
  await assert.rejects(api.apiCore.get('/users/me'));
  assert.equal(chamadas[1].headers.Authorization, undefined);
});
