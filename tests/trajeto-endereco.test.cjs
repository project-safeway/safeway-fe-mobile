const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarTrajeto() {
  const context = vm.createContext({});
  const trajeto = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '..', 'utils', 'trajeto.js'), 'utf8'),
    { context }
  );
  await trajeto.link(() => {
    throw new Error('Import inesperado em trajeto.js');
  });
  await trajeto.evaluate();
  return trajeto.namespace;
}

test('toStops inclui addressId para alunos com endereco selecionado e omite para escolas', async () => {
  const { buildTrajeto, toStops } = await carregarTrajeto();

  const lista = buildTrajeto([
    {
      type: 'ALUNO',
      id: 'aluno-1',
      name: 'Enzo',
      address: { id: 'addr-mae', street: 'Rua A' },
    },
    {
      type: 'ESCOLA',
      id: 'escola-1',
      name: 'EMEF Centro',
      address: { id: 'addr-escola', street: 'Av B' },
    },
  ]);

  const stops = JSON.parse(JSON.stringify(toStops(lista)));
  assert.deepEqual(stops, [
    { type: 'ALUNO', id: 'aluno-1', generalOrder: 1, specificOrder: 1, addressId: 'addr-mae' },
    { type: 'ESCOLA', id: 'escola-1', generalOrder: 2, specificOrder: 1 },
  ]);
});
