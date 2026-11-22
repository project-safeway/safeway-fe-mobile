const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarUtils() {
  const context = vm.createContext({});
  const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'utils', arquivo), 'utf8');

  const constants = new vm.SourceTextModule(ler('constants.js'), { context });
  await constants.link(() => {
    throw new Error('Import inesperado em constants.js');
  });
  await constants.evaluate();

  const formatters = new vm.SourceTextModule(ler('formatters.js'), { context });
  await formatters.link(() => {
    throw new Error('Import inesperado em formatters.js');
  });
  await formatters.evaluate();

  const validators = new vm.SourceTextModule(ler('validators.js'), { context });
  await validators.link((nome) => {
    if (nome === './constants') return constants;
    throw new Error(`Import inesperado em validators.js: ${nome}`);
  });
  await validators.evaluate();

  const alunoForm = new vm.SourceTextModule(ler('alunoForm.js'), { context });
  await alunoForm.link((nome) => {
    if (nome === './formatters') return formatters;
    if (nome === './validators') return validators;
    throw new Error(`Import inesperado em alunoForm.js: ${nome}`);
  });
  await alunoForm.evaluate();

  return alunoForm.namespace;
}

async function carregarServico(respostas = []) {
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
        body: opcoes.body ? JSON.parse(opcoes.body) : undefined,
      });
      const atual = respostas[indice++] ?? { status: 200, body: '{}' };
      return {
        ok: atual.status >= 200 && atual.status < 300,
        status: atual.status,
        text: async () => (typeof atual.body === 'string' ? atual.body : JSON.stringify(atual.body)),
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

  const alunos = new vm.SourceTextModule(ler('alunos.js'), { context });
  await alunos.link((nome) => {
    if (nome === './api') return api;
    throw new Error(`Import inesperado em alunos.js: ${nome}`);
  });
  await alunos.evaluate();

  api.namespace.definirToken('token-teste');
  return { alunos: alunos.namespace, chamadas };
}

const ALUNO_API = {
  id: 'student-1',
  name: 'Enzo Silva',
  professor: 'Profa. Ana',
  birthdate: '2016-03-12',
  grade: 4,
  classroom: 'B',
  monthlyFee: 470,
  dueDate: 10,
  school: { id: 'school-1', name: 'EMEF Centro' },
  guardians: [
    {
      id: 'guardian-1',
      name: 'Maria Silva',
      primaryPhoneNumber: '11988887777',
      secondaryPhoneNumber: '1133334444',
      email: 'maria@exemplo.com',
      address: {
        street: 'Rua das Flores',
        number: '120',
        additionalDetails: 'Apto 2',
        neighborhood: 'Centro',
        city: 'São Caetano do Sul',
        federalUnit: 'SP',
        zipCode: '09561000',
        type: 'PONTO_DE_ENCONTRO',
        principal: true,
      },
    },
  ],
};

test('preenche estado inicial da edicao com mascaras e monta payload compativel com StudentRequest', async () => {
  const { criarEstadoInicialAluno, validarFormularioAluno, montarPayloadAluno } = await carregarUtils();

  const estado = criarEstadoInicialAluno(ALUNO_API);
  assert.equal(estado.nascimento, '12/03/2016');
  assert.equal(estado.mensalidade, '470,00');
  assert.equal(estado.vencimentoDia, '10');
  assert.equal(estado.serie, '4');
  assert.equal(estado.escolaId, 'school-1');
  assert.equal(estado.responsaveis[0].tel1, '(11) 98888-7777');
  assert.equal(estado.responsaveis[0].tel2, '(11) 3333-4444');
  assert.equal(estado.responsaveis[0].endereco.cep, '09561-000');

  assert.deepEqual(Object.keys(validarFormularioAluno(estado, '2026-11-22')), []);

  const payload = JSON.parse(JSON.stringify(montarPayloadAluno(estado)));
  assert.deepEqual(payload, {
    name: 'Enzo Silva',
    professor: 'Profa. Ana',
    birthdate: '2016-03-12',
    grade: 4,
    classroom: 'B',
    monthlyFee: 470,
    dueDate: 10,
    schoolId: 'school-1',
    guardian: [
      {
        name: 'Maria Silva',
        primaryPhoneNumber: '11988887777',
        secondaryPhoneNumber: '1133334444',
        email: 'maria@exemplo.com',
        address: {
          street: 'Rua das Flores',
          number: '120',
          additionalDetails: 'Apto 2',
          neighborhood: 'Centro',
          city: 'São Caetano do Sul',
          federalUnit: 'SP',
          zipCode: '09561000',
          type: 'PONTO_DE_ENCONTRO',
          principal: true,
        },
      },
    ],
  });
});

test('valida campos obrigatorios, data de nascimento no passado e limites de vencimento', async () => {
  const { criarEstadoInicialAluno, validarFormularioAluno } = await carregarUtils();

  const estado = criarEstadoInicialAluno();
  estado.nascimento = '22/11/2026';
  estado.vencimentoDia = '32';
  estado.responsaveis[0].email = 'invalido';
  estado.responsaveis[0].tel2 = '123';

  const erros = validarFormularioAluno(estado, '2026-11-22');
  assert.ok(erros.nome);
  assert.ok(erros.nascimento);
  assert.ok(erros.professor);
  assert.ok(erros.escolaId);
  assert.ok(erros.mensalidade);
  assert.ok(erros.vencimentoDia);
  assert.ok(erros.resp_0_nome);
  assert.ok(erros.resp_0_tel1);
  assert.ok(erros.resp_0_tel2);
  assert.ok(erros.resp_0_email);
  assert.ok(erros.resp_0_cep);
});

test('detecta somente responsaveis alterados para evitar chamadas desnecessarias de geocodificacao', async () => {
  const { criarEstadoInicialAluno, responsaveisParaSalvar } = await carregarUtils();

  const estado = criarEstadoInicialAluno(ALUNO_API);
  assert.equal(responsaveisParaSalvar(ALUNO_API.guardians, estado.responsaveis).length, 0);

  estado.responsaveis[0].nome = 'Maria Souza';
  const alteracoes = responsaveisParaSalvar(ALUNO_API.guardians, estado.responsaveis);
  assert.equal(alteracoes.length, 1);
  assert.equal(alteracoes[0].id, 'guardian-1');
  assert.equal(alteracoes[0].payload.name, 'Maria Souza');
});

test('atualizarAlunoCompleto envia somente PUT /students/{id} quando responsavel nao mudou', async () => {
  const { alunos, chamadas } = await carregarServico([{ status: 200, body: { id: 'student-1' } }]);

  await alunos.atualizarAlunoCompleto('student-1', { name: 'Enzo Atualizado' }, []);

  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].method, 'PUT');
  assert.equal(chamadas[0].url, 'http://localhost:8080/students/student-1');
});

test('atualizarAlunoCompleto atualiza responsavel modificado antes do aluno e sinaliza falha parcial', async () => {
  const { alunos, chamadas } = await carregarServico([
    { status: 200, body: { id: 'guardian-1' } },
    { status: 500, body: 'Erro interno' },
  ]);

  await assert.rejects(
    alunos.atualizarAlunoCompleto(
      'student-1',
      { name: 'Enzo Atualizado' },
      [{ id: 'guardian-1', payload: { name: 'Maria Souza' } }]
    ),
    (erro) => erro.status === 500 && erro.parcial === true
  );

  assert.equal(chamadas.length, 2);
  assert.equal(chamadas[0].url, 'http://localhost:8080/guardians/guardian-1');
  assert.equal(chamadas[1].url, 'http://localhost:8080/students/student-1');
});

test('atualizarAlunoCompleto cria e vincula responsavel novo quando aluno nao tinha responsavel com id', async () => {
  const { alunos, chamadas } = await carregarServico([
    { status: 201, body: { id: 'guardian-novo' } },
    { status: 204, body: '' },
    { status: 200, body: { id: 'student-1' } },
  ]);

  await alunos.atualizarAlunoCompleto(
    'student-1',
    { name: 'Enzo Atualizado' },
    [{ id: null, payload: { name: 'Responsavel Novo' } }]
  );

  assert.equal(chamadas.length, 3);
  assert.equal(chamadas[0].method, 'POST');
  assert.equal(chamadas[0].url, 'http://localhost:8080/guardians');
  assert.equal(chamadas[1].method, 'PUT');
  assert.equal(chamadas[1].url, 'http://localhost:8080/students/student-1/guardians/guardian-novo');
  assert.equal(chamadas[2].method, 'PUT');
  assert.equal(chamadas[2].url, 'http://localhost:8080/students/student-1');
});

test('filtra responsaveis disponiveis para vincular excluindo os ja vinculados e ordenando por nome', async () => {
  const { responsaveisDisponiveisParaVincular } = await carregarUtils();

  const todos = [
    { id: 'g-3', name: 'Zilda' },
    { id: 'g-1', name: 'Ana' },
    { id: 'g-2', name: 'Carlos' },
  ];
  const disponiveis = responsaveisDisponiveisParaVincular(todos, [{ id: 'g-1', name: 'Ana' }]);

  assert.deepEqual(
    Array.from(disponiveis, (g) => g.id),
    ['g-2', 'g-3']
  );
});

test('servicos de listar, criar+vincular e desvincular responsaveis chamam os endpoints corretos', async () => {
  const { alunos, chamadas } = await carregarServico([
    { status: 200, body: [{ id: 'g-1', name: 'Maria' }] },
    { status: 201, body: { id: 'g-2', name: 'João' } },
    { status: 204, body: '' },
    { status: 204, body: '' },
  ]);

  const lista = await alunos.listarResponsaveis();
  assert.equal(lista.length, 1);

  const criado = await alunos.criarEVincularResponsavel('student-1', { name: 'João' });
  assert.equal(criado.id, 'g-2');

  await alunos.desvincularResponsavel('student-1', 'g-2');

  assert.equal(chamadas[0].method, 'GET');
  assert.equal(chamadas[0].url, 'http://localhost:8080/guardians');
  assert.equal(chamadas[1].method, 'POST');
  assert.equal(chamadas[1].url, 'http://localhost:8080/guardians');
  assert.equal(chamadas[2].method, 'PUT');
  assert.equal(chamadas[2].url, 'http://localhost:8080/students/student-1/guardians/g-2');
  assert.equal(chamadas[3].method, 'DELETE');
  assert.equal(chamadas[3].url, 'http://localhost:8080/students/student-1/guardians/g-2');
});

test('identifica responsavel principal e monta somente alteracoes necessarias ao trocar principal', async () => {
  const { responsavelPrincipal, montarPayloadsDefinirPrincipal } = await carregarUtils();

  const g1 = { ...ALUNO_API.guardians[0], id: 'g-1', address: { ...ALUNO_API.guardians[0].address, principal: true } };
  const g2 = { ...ALUNO_API.guardians[0], id: 'g-2', name: 'Pai', address: { ...ALUNO_API.guardians[0].address, principal: false } };

  assert.equal(responsavelPrincipal([g2, g1]).id, 'g-1');
  assert.equal(responsavelPrincipal([{ ...g2, address: { ...g2.address, principal: false } }]).id, 'g-2');

  const alteracoes = JSON.parse(JSON.stringify(montarPayloadsDefinirPrincipal([g1, g2], 'g-2')));
  assert.equal(alteracoes.length, 2);
  assert.equal(alteracoes[0].id, 'g-1');
  assert.equal(alteracoes[0].payload.address.principal, false);
  assert.equal(alteracoes[1].id, 'g-2');
  assert.equal(alteracoes[1].payload.address.principal, true);
});
