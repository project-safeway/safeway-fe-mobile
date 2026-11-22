const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function carregarPresenca() {
  const context = vm.createContext({});
  const colors = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '..', 'constants', 'colors.js'), 'utf8'),
    { context }
  );
  await colors.link(() => {
    throw new Error('Import inesperado em colors.js');
  });
  await colors.evaluate();

  const presenca = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '..', 'utils', 'presenca.js'), 'utf8'),
    { context }
  );
  await presenca.link((nome) => {
    if (nome === '../constants/colors') return colors;
    throw new Error(`Import inesperado em presenca.js: ${nome}`);
  });
  await presenca.evaluate();

  return presenca.namespace;
}

test('converte PRESENT, DELIVERED e ABSENT da API corretamente', async () => {
  const { statusPresencaDaApi, infoPresenca } = await carregarPresenca();

  assert.equal(statusPresencaDaApi('PRESENT'), 'PRESENTE');
  assert.equal(statusPresencaDaApi('DELIVERED'), 'ENTREGUE');
  assert.equal(statusPresencaDaApi('ABSENT'), 'AUSENTE');
  assert.equal(statusPresencaDaApi(undefined), 'AUSENTE');

  assert.equal(infoPresenca(statusPresencaDaApi('DELIVERED')).rotulo, 'Entregue');
  assert.equal(infoPresenca(statusPresencaDaApi('PRESENT')).rotulo, 'Presente');
  assert.equal(infoPresenca(statusPresencaDaApi('ABSENT')).rotulo, 'Ausente');
});
