import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOcrText } from '../src/utils/ocrParser.ts';

test('Laudo arterial típico: extrai parâmetros principais e eletrólitos', () => {
  const texto = [
    'Gasometria Arterial',
    'pH: 7.35',
    'pCO2: 48',
    'pO2: 92',
    'HCO3: 26.5',
    'BE: -1.0',
    'SatO2: 96',
    'Na: 140',
    'Cl: 104',
    'K: 4.2',
  ].join('\n');

  const r = parseOcrText(texto);
  assert.equal(r.type, 'arterial');
  assert.equal(r.pH, 7.35);
  assert.equal(r.pCO2, 48);
  assert.equal(r.pO2, 92);
  assert.equal(r.HCO3, 26.5);
  assert.equal(r.BE, -1.0);
  assert.equal(r.SatO2, 96);
  assert.equal(r.Na, 140);
  assert.equal(r.Cl, 104);
  assert.equal(r.K, 4.2);
});

test('Detecta exame venoso pela palavra-chave', () => {
  const texto = 'Gasometria Venosa\npH: 7.33\npCO2: 46\nHCO3: 25\nBE: 0';
  const r = parseOcrText(texto);
  assert.equal(r.type, 'venous');
});

test('Normaliza vírgula decimal para ponto', () => {
  const texto = 'pH: 7,28\npCO2: 55\nHCO3: 22,0';
  const r = parseOcrText(texto);
  assert.equal(r.pH, 7.28);
  assert.equal(r.HCO3, 22.0);
});

test('Ignora valores claramente fora de faixa fisiológica', () => {
  // pH 9.9 está fora de 6.5–8.0 e não deve ser aceito
  const texto = 'pH: 9.9\npCO2: 40\nHCO3: 24';
  const r = parseOcrText(texto);
  assert.equal(r.pH, undefined);
  assert.equal(r.pCO2, 40);
});

test('Reconhece prefixo Pa (PaCO2/PaO2) e bicarbonato por extenso', () => {
  const texto = 'pH 7.31\nPaCO2 52\nPaO2 68\nBicarbonato 25.0\nBE -2';
  const r = parseOcrText(texto);
  assert.equal(r.pH, 7.31);
  assert.equal(r.pCO2, 52);
  assert.equal(r.pO2, 68);
  assert.equal(r.HCO3, 25.0);
  assert.equal(r.BE, -2);
});

test('Tolera unidade/parênteses entre o rótulo e o valor', () => {
  const texto = 'pCO2 (mmHg): 38\nHCO3- = 22.5\nSatO2 .... 95';
  const r = parseOcrText(texto);
  assert.equal(r.pCO2, 38);
  assert.equal(r.HCO3, 22.5);
  assert.equal(r.SatO2, 95);
});

test('pO2 não casa por engano dentro de "pCO2"', () => {
  // Só há pCO2 no texto; pO2 deve ficar indefinido, não "roubar" o 44 do pCO2
  const texto = 'pCO2: 44';
  const r = parseOcrText(texto);
  assert.equal(r.pCO2, 44);
  assert.equal(r.pO2, undefined);
});
