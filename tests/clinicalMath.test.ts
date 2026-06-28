import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretBloodGas } from '../src/utils/clinicalMath.ts';
import { CLINICAL_TEST_CASES } from '../src/utils/mockData.ts';

// Atalho para localizar um caso clínico do mockData pelo nome (prefixo)
const caseByName = (prefix: string) => {
  const tc = CLINICAL_TEST_CASES.find((c) => c.name.startsWith(prefix));
  if (!tc) throw new Error(`Caso não encontrado: ${prefix}`);
  return interpretBloodGas(tc.inputs);
};

test('Cetoacidose Diabética: acidose metabólica, HAGMA, Winters adequado, delta-delta puro', () => {
  const r = caseByName('Cetoacidose');
  assert.equal(r.phClassification, 'Acidemia');
  assert.equal(r.primaryDisorder, 'Acidose Metabólica');
  assert.equal(r.anionGap.classification, 'high');
  assert.equal(r.anionGap.calculated, 31); // 136 - (100 + 5)
  assert.equal(r.compensation.status, 'adequate'); // Winters: 1.5*5+8 = 15.5 ± 2, obs 15
  assert.equal(r.deltaDelta.classification, 'hagma_only');
  assert.equal(r.oxygenation.pfRatio, 452); // 95 / 0.21
});

test('DPOC agudizado sobre crônico NÃO sinaliza falsa alcalose metabólica', () => {
  const r = caseByName('DPOC');
  assert.equal(r.primaryDisorder, 'Acidose Respiratória Agudizada sobre Crônica');
  assert.equal(r.compensation.status, 'adequate');
  // Regressão central desta correção: nenhum distúrbio metabólico associado deve ser inventado
  assert.deepEqual(r.subDisturbances, []);
});

test('Acidose respiratória crônica pura é rotulada como Crônica', () => {
  const r = interpretBloodGas({
    type: 'arterial', pH: 7.34, pCO2: 60, pO2: 60, HCO3: 31, BE: 5, SatO2: 90,
  } as any);
  assert.equal(r.primaryDisorder, 'Acidose Respiratória Crônica');
  assert.equal(r.compensation.status, 'adequate');
  assert.deepEqual(r.subDisturbances, []);
});

test('Acidose respiratória + acidose metabólica (HCO₃ baixo demais) detecta distúrbio misto', () => {
  const r = interpretBloodGas({
    type: 'arterial', pH: 7.10, pCO2: 60, pO2: 70, HCO3: 18, BE: -8, SatO2: 90,
  } as any);
  assert.match(r.primaryDisorder, /Misto/);
  assert.match(r.primaryDisorder, /Acidose Respiratória/);
  assert.match(r.primaryDisorder, /Acidose Metabólica/);
});

test('Alcalose metabólica por vômitos: compensação respiratória adequada', () => {
  const r = caseByName('Vômitos');
  assert.equal(r.phClassification, 'Alcalemia');
  assert.equal(r.primaryDisorder, 'Alcalose Metabólica');
  assert.equal(r.compensation.status, 'adequate'); // 40 + 0.7*(35-24) = 47.7 ± 2, obs 47
});

test('Alcalose respiratória aguda (pânico) sem distúrbio metabólico associado', () => {
  const r = caseByName('Crise de Pânico');
  assert.equal(r.primaryDisorder, 'Alcalose Respiratória Aguda');
  assert.equal(r.compensation.status, 'adequate');
  assert.deepEqual(r.subDisturbances, []);
});

test('Gasometria venosa normal: classificada normal e com alerta de segurança venoso', () => {
  const r = caseByName('Gasometria Venosa');
  assert.equal(r.phClassification, 'Normal');
  assert.equal(r.oxygenation.pfRatio, null); // venoso não calcula oxigenação
  assert.ok(r.warnings.some((w) => w.includes('VENOSO')));
});

test('Sepse: HAGMA + NAGMA concomitantes detectados via AG corrigido por albumina', () => {
  const r = caseByName('Sepsis');
  assert.equal(r.anionGap.calculated, 15); // 135 - (112 + 8)
  assert.equal(r.anionGap.corrected, 19.5); // 15 + 2.5*(4 - 2.2)
  assert.equal(r.anionGap.classification, 'high');
  assert.equal(r.deltaDelta.classification, 'nagma_associated'); // (19.5-12)/(24-8) = 0.47 < 0.8
  assert.ok(r.subDisturbances.some((d) => d.includes('HAGMA')));
  assert.ok(r.subDisturbances.some((d) => d.includes('NAGMA')));
});

test('Gradiente A-a usa idade quando informada (esperado = idade/4 + 4)', () => {
  const r = interpretBloodGas({
    type: 'arterial', pH: 7.40, pCO2: 40, pO2: 90, HCO3: 24, BE: 0, SatO2: 97, FiO2: 21, Age: 40,
  } as any);
  assert.equal(r.oxygenation.expectedAaGradient, 14); // 40/4 + 4
});

test('Perfil laboratorialmente incompatível gera alerta', () => {
  const r = interpretBloodGas({
    type: 'arterial', pH: 7.20, pCO2: 30, pO2: 90, HCO3: 30, BE: 4, SatO2: 97,
  } as any);
  assert.ok(r.warnings.some((w) => w.includes('incompatível')));
});
