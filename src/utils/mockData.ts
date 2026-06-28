import type { BloodGasInputs } from '../types';

export interface TestCase {
  name: string;
  description: string;
  inputs: BloodGasInputs;
}

export const CLINICAL_TEST_CASES: TestCase[] = [
  {
    name: "Cetoacidose Diabética (CAD)",
    description: "Acidose metabólica grave com anion gap elevado (HAGMA) e compensação respiratória adequada (hiperventilação profunda).",
    inputs: {
      type: 'arterial',
      pH: 7.15,
      pCO2: 15,
      pO2: 95,
      HCO3: 5,
      BE: -20,
      SatO2: 98,
      Na: 136,
      Cl: 100,
      Albumin: 4.0,
      FiO2: 21,
      Age: 24
    }
  },
  {
    name: "DPOC Exacerbado (Acidose Mista/Aguda sobre Crônica)",
    description: "Acidose respiratória grave (hipercapnia) por retenção de CO₂ e fadiga respiratória em paciente idoso.",
    inputs: {
      type: 'arterial',
      pH: 7.26,
      pCO2: 68,
      pO2: 52,
      HCO3: 30,
      BE: 3,
      SatO2: 84,
      Na: 138,
      Cl: 98,
      FiO2: 24, // Usando cateter de O2 a 1L/min ~ 24%
      Age: 68
    }
  },
  {
    name: "Vômitos Incoercíveis (Alcalose Metabólica)",
    description: "Alcalose metabólica decorrente de perda de ácido clorídrico gástrico, com compensação respiratória e hipocloremia.",
    inputs: {
      type: 'arterial',
      pH: 7.50,
      pCO2: 47,
      pO2: 90,
      HCO3: 35,
      BE: 11,
      SatO2: 97,
      Na: 140,
      Cl: 92,
      Age: 45
    }
  },
  {
    name: "Crise de Pânico / Ansiedade (Alcalose Respiratória)",
    description: "Alcalose respiratória aguda secundária à hiperventilação psicogênica, com bicarbonato e eletrólitos normais.",
    inputs: {
      type: 'arterial',
      pH: 7.51,
      pCO2: 24,
      pO2: 104,
      HCO3: 20,
      BE: -2,
      SatO2: 99,
      Na: 139,
      Cl: 104,
      Age: 21
    }
  },
  {
    name: "Gasometria Venosa Normal",
    description: "Exame colhido por punção venosa em paciente hemodinamicamente estável, mostrando valores normais para sangue venoso.",
    inputs: {
      type: 'venous',
      pH: 7.35, // Normal venoso é 7.31 - 7.41
      pCO2: 46, // Normal venoso é 41 - 51
      pO2: 36,  // Normal venoso é 30 - 40
      HCO3: 24,
      BE: 0,
      SatO2: 70, // SatO2 venosa normal 60-80%
      Na: 140,
      Cl: 104
    }
  },
  {
    name: "Sepsis grave + Lacticacidose (HAGMA + NAGMA Misto)",
    description: "Choque séptico com hipoperfusão (lacticacidose), hipoalbuminemia e acidose hiperclorêmica associada, mostrando uma relação Delta-Delta complexa.",
    inputs: {
      type: 'arterial',
      pH: 7.20,
      pCO2: 22,
      pO2: 75,
      HCO3: 8,
      BE: -16,
      SatO2: 94,
      Na: 135,
      Cl: 112, // Cloro elevado
      Albumin: 2.2, // Hipoalbuminemia importante
      FiO2: 35, // Máscara de oxigênio
      Age: 62
    }
  }
];
