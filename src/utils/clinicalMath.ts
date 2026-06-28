import type { 
  BloodGasInputs, 
  InterpretationResult, 
  CompensationDetails, 
  AnionGapDetails, 
  DeltaDeltaDetails, 
  OxygenationDetails 
} from '../types';

/**
 * Realiza a interpretação clínica completa de uma gasometria arterial ou venosa
 * com base na literatura médica tradicional (Marino's ICU Book, West, ATS/ERS).
 */
export function interpretBloodGas(inputs: BloodGasInputs): InterpretationResult {
  const { type, pH, pCO2, pO2, HCO3, Na, Cl, Albumin, FiO2, Age } = inputs;

  const warnings: string[] = [];
  const subDisturbances: string[] = [];
  const condutas: string[] = [];

  // 1. Limites de Referência por tipo de exame
  const isArterial = type === 'arterial';
  const phMin = isArterial ? 7.35 : 7.31;
  const phMax = isArterial ? 7.45 : 7.41;
  const pco2Min = isArterial ? 35 : 41;
  const pco2Max = isArterial ? 45 : 51;
  const hco3Min = isArterial ? 22 : 22; // Usando 22-26 arterial e 22-28 venoso
  const hco3Max = isArterial ? 26 : 28;

  // Alerta clínico de segurança para exames venosos
  if (!isArterial) {
    warnings.push(
      "Exame VENOSO: Os valores de pO₂ e SatO₂ representam apenas a extração tecidual local e NÃO servem para avaliar a oxigenação pulmonar ou trocas gasosas sistêmicas. Não use pO₂ ou SatO₂ venosos para guiar condutas de oxigenoterapia."
    );
  }

  // 2. Classificação do pH (Acidemia vs Alcalemia vs Normal)
  let phClassification: 'Acidemia' | 'Alcalemia' | 'Normal';
  if (pH < phMin) {
    phClassification = 'Acidemia';
  } else if (pH > phMax) {
    phClassification = 'Alcalemia';
  } else {
    phClassification = 'Normal';
  }

  // 3. Determinação do Distúrbio Primário
  let primaryDisorder = 'Normalidade';
  let isMetabolicAcidosis = false;
  let isMetabolicAlkalosis = false;
  let isRespiratoryAcidosis = false;
  let isRespiratoryAlkalosis = false;

  if (phClassification === 'Acidemia') {
    const respAcid = pCO2 > pco2Max;
    const metaAcid = HCO3 < hco3Min;

    if (respAcid && metaAcid) {
      primaryDisorder = 'Distúrbio Misto: Acidose Respiratória e Acidose Metabólica';
      isRespiratoryAcidosis = true;
      isMetabolicAcidosis = true;
    } else if (respAcid) {
      primaryDisorder = 'Acidose Respiratória';
      isRespiratoryAcidosis = true;
    } else if (metaAcid) {
      primaryDisorder = 'Acidose Metabólica';
      isMetabolicAcidosis = true;
    } else {
      // pH baixo com pCO2 baixo e HCO3 alto (incomum, erro de coleta ou lab)
      primaryDisorder = 'Acidemia Não Classificável (Sugerido Erro Laboratorial)';
      warnings.push("Perfil de gasometria incompatível: pH baixo com pCO₂ baixo e HCO₃⁻ alto. Verifique possibilidade de erro de coleta ou laboratório.");
    }
  } else if (phClassification === 'Alcalemia') {
    const respAlk = pCO2 < pco2Min;
    const metaAlk = HCO3 > hco3Max;

    if (respAlk && metaAlk) {
      primaryDisorder = 'Distúrbio Misto: Alcalose Respiratória e Alcalose Metabólica';
      isRespiratoryAlkalosis = true;
      isMetabolicAlkalosis = true;
    } else if (respAlk) {
      primaryDisorder = 'Alcalose Respiratória';
      isRespiratoryAlkalosis = true;
    } else if (metaAlk) {
      primaryDisorder = 'Alcalose Metabólica';
      isMetabolicAlkalosis = true;
    } else {
      primaryDisorder = 'Alcalemia Não Classificável (Sugerido Erro Laboratorial)';
      warnings.push("Perfil de gasometria incompatível: pH alto com pCO₂ alto e HCO₃⁻ baixo. Verifique possibilidade de erro de coleta ou laboratório.");
    }
  } else {
    // pH Normal, mas pode haver distúrbio compensado ou misto
    const pco2High = pCO2 > pco2Max;
    const pco2Low = pCO2 < pco2Min;
    const hco3High = HCO3 > hco3Max;
    const hco3Low = HCO3 < hco3Min;

    if (pco2High && hco3High) {
      // Acidose respiratória compensada ou Alcalose metabólica compensada
      // Avaliamos o pH em relação a 7.40 (arterial) ou 7.36 (venoso) para inferir o distúrbio primário
      const midPh = isArterial ? 7.40 : 7.36;
      if (pH < midPh) {
        primaryDisorder = 'Acidose Respiratória Crônica Compensada';
        isRespiratoryAcidosis = true;
      } else {
        primaryDisorder = 'Alcalose Metabólica Compensada';
        isMetabolicAlkalosis = true;
      }
    } else if (pco2Low && hco3Low) {
      // Acidose metabólica compensada ou Alcalose respiratória compensada
      const midPh = isArterial ? 7.40 : 7.36;
      if (pH < midPh) {
        primaryDisorder = 'Acidose Metabólica Compensada';
        isMetabolicAcidosis = true;
      } else {
        primaryDisorder = 'Alcalose Respiratória Crônica Compensada';
        isRespiratoryAlkalosis = true;
      }
    } else if (pco2High && hco3Low) {
      // Dupla acidose (pH pode cair para normal se for muito leve, mas tipicamente acidemia)
      primaryDisorder = 'Distúrbio Misto Leve: Acidose Respiratória e Acidose Metabólica';
      isRespiratoryAcidosis = true;
      isMetabolicAcidosis = true;
    } else if (pco2Low && hco3High) {
      // Dupla alcalose (pH pode estar no limite normal alto)
      primaryDisorder = 'Distúrbio Misto Leve: Alcalose Respiratória e Alcalose Metabólica';
      isRespiratoryAlkalosis = true;
      isMetabolicAlkalosis = true;
    } else if (pco2High || pco2Low || hco3High || hco3Low) {
      // Apenas um parâmetro levemente alterado com pH normal
      primaryDisorder = 'Alteração Ácido-Base Discreta / Fase de Transição';
      if (pco2High) isRespiratoryAcidosis = true;
      if (pco2Low) isRespiratoryAlkalosis = true;
      if (hco3High) isMetabolicAlkalosis = true;
      if (hco3Low) isMetabolicAcidosis = true;
    } else {
      primaryDisorder = 'Gasometria dentro dos Limites Normais';
      condutas.push("Manter monitorização clínica de rotina. Nenhuma conduta ácido-base específica é necessária no momento.");
    }
  }

  // 4. Avaliação de Compensação Respiratória/Metabólica
  let compensation: CompensationDetails = {
    isCompensated: true,
    status: 'na',
    observed: 0,
    expectedMin: 0,
    expectedMax: 0,
    expectedValueText: '',
    formulaUsed: ''
  };

  // Avaliação da compensação apenas se houver distúrbio primário único definido
  // (Em distúrbios mistos óbvios como acidose dupla, a compensação já falhou de ambos os lados)
  const hasSingleMetabolic = (isMetabolicAcidosis && !isRespiratoryAcidosis) || (isMetabolicAlkalosis && !isRespiratoryAlkalosis);
  const hasSingleRespiratory = (isRespiratoryAcidosis && !isMetabolicAcidosis) || (isRespiratoryAlkalosis && !isMetabolicAlkalosis);

  if (hasSingleMetabolic) {
    if (isMetabolicAcidosis) {
      // Winters Formula: pCO2 = 1.5 * HCO3 + 8 +/- 2
      const expValue = 1.5 * HCO3 + 8;
      const minExp = expValue - 2;
      const maxExp = expValue + 2;
      compensation = {
        isCompensated: pCO2 >= minExp && pCO2 <= maxExp,
        status: pCO2 > maxExp ? 'insufficient' : pCO2 < minExp ? 'excessive' : 'adequate',
        observed: pCO2,
        expectedMin: Math.round(minExp * 10) / 10,
        expectedMax: Math.round(maxExp * 10) / 10,
        expectedValueText: `${Math.round(minExp * 10) / 10} - ${Math.round(maxExp * 10) / 10} mmHg`,
        formulaUsed: "Fórmula de Winters: pCO₂ esperado = (1.5 × HCO₃⁻) + 8 ± 2"
      };

      if (compensation.status === 'insufficient') {
        subDisturbances.push("Acidose Respiratória Associada (retenção de pCO₂ maior que o esperado)");
      } else if (compensation.status === 'excessive') {
        subDisturbances.push("Alcalose Respiratória Associada (hiperventilação maior que o esperado)");
      }
    } else if (isMetabolicAlkalosis) {
      // Expected pCO2 = 40 + 0.7 * (HCO3 - 24) +/- 2
      const expValue = 40 + 0.7 * (HCO3 - 24);
      const minExp = expValue - 2;
      const maxExp = expValue + 2;
      compensation = {
        isCompensated: pCO2 >= minExp && pCO2 <= maxExp,
        status: pCO2 > maxExp ? 'excessive' : pCO2 < minExp ? 'insufficient' : 'adequate', // Para alcalose, pCO2 maior = hipoventilação compensatória
        observed: pCO2,
        expectedMin: Math.round(minExp * 10) / 10,
        expectedMax: Math.round(maxExp * 10) / 10,
        expectedValueText: `${Math.round(minExp * 10) / 10} - ${Math.round(maxExp * 10) / 10} mmHg`,
        formulaUsed: "pCO₂ esperado = 40 + 0.7 × (HCO₃⁻ - 24) ± 2"
      };

      // pCO2 acima da compensação esperada indica Acidose Respiratória concomitante
      if (pCO2 > maxExp) {
        subDisturbances.push("Acidose Respiratória Associada (hipoventilação excessiva)");
        compensation.status = 'excessive'; // hipoventilação excessiva = acidose resp associada
      } else if (pCO2 < minExp) {
        subDisturbances.push("Alcalose Respiratória Associada (falha na hipoventilação compensatória)");
        compensation.status = 'insufficient'; // hipoventilação insuficiente = alcalose resp associada
      } else {
        compensation.status = 'adequate';
      }
    }
  } else if (hasSingleRespiratory) {
    if (isRespiratoryAcidosis) {
      // Na acidose respiratória avaliamos resposta aguda vs crônica
      // Agudo: +1 mEq/L HCO3 para cada +10 pCO2 acima de 40
      // Crônico: +3.5 mEq/L HCO3 para cada +10 pCO2 acima de 40
      const deltaPco2 = Math.max(0, pCO2 - 40);
      const hco3Acute = 24 + (1 * deltaPco2) / 10;
      const hco3Chronic = 24 + (3.5 * deltaPco2) / 10;

      // Verificamos qual compensação o HCO3 observado está mais próximo
      const diffAcute = Math.abs(HCO3 - hco3Acute);
      const diffChronic = Math.abs(HCO3 - hco3Chronic);
      const isChronic = diffChronic < diffAcute;

      const expectedVal = isChronic ? hco3Chronic : hco3Acute;
      const minExp = expectedVal - 2;
      const maxExp = expectedVal + 2;

      compensation = {
        isCompensated: HCO3 >= minExp && HCO3 <= maxExp,
        status: HCO3 > maxExp ? 'excessive' : HCO3 < minExp ? 'insufficient' : 'adequate',
        observed: HCO3,
        expectedMin: Math.round(minExp * 10) / 10,
        expectedMax: Math.round(maxExp * 10) / 10,
        expectedValueText: `Agudo: ${Math.round((hco3Acute - 2) * 10) / 10}-${Math.round((hco3Acute + 2) * 10) / 10} | Crônico: ${Math.round((hco3Chronic - 2) * 10) / 10}-${Math.round((hco3Chronic + 2) * 10) / 10} mEq/L`,
        formulaUsed: `Esperado (${isChronic ? 'Crônico' : 'Agudo'}): HCO₃⁻ = 24 + ${isChronic ? '3.5' : '1'} × (pCO₂ - 40)/10 ± 2`
      };

      if (HCO3 > maxExp) {
        subDisturbances.push("Alcalose Metabólica Associada (elevação de HCO₃⁻ maior que a compensação renal esperada)");
      } else if (HCO3 < minExp) {
        subDisturbances.push("Acidose Metabólica Associada (elevação de HCO₃⁻ menor que o esperado para a compensação)");
      }
    } else if (isRespiratoryAlkalosis) {
      // Agudo: -2 mEq/L HCO3 para cada -10 pCO2 abaixo de 40 (limite inferior ~18)
      // Crônico: -5 mEq/L HCO3 para cada -10 pCO2 abaixo de 40 (limite inferior ~12-14)
      const deltaPco2 = Math.max(0, 40 - pCO2);
      const hco3Acute = Math.max(18, 24 - (2 * deltaPco2) / 10);
      const hco3Chronic = Math.max(12, 24 - (5 * deltaPco2) / 10);

      const diffAcute = Math.abs(HCO3 - hco3Acute);
      const diffChronic = Math.abs(HCO3 - hco3Chronic);
      const isChronic = diffChronic < diffAcute;

      const expectedVal = isChronic ? hco3Chronic : hco3Acute;
      const minExp = expectedVal - 2;
      const maxExp = expectedVal + 2;

      compensation = {
        isCompensated: HCO3 >= minExp && HCO3 <= maxExp,
        status: HCO3 > maxExp ? 'insufficient' : HCO3 < minExp ? 'excessive' : 'adequate', // Para alcalose resp, menor HCO3 = mais compensação renal
        observed: HCO3,
        expectedMin: Math.round(minExp * 10) / 10,
        expectedMax: Math.round(maxExp * 10) / 10,
        expectedValueText: `Agudo: ${Math.round((hco3Acute - 2) * 10) / 10}-${Math.round((hco3Acute + 2) * 10) / 10} | Crônico: ${Math.round((hco3Chronic - 2) * 10) / 10}-${Math.round((hco3Chronic + 2) * 10) / 10} mEq/L`,
        formulaUsed: `Esperado (${isChronic ? 'Crônico' : 'Agudo'}): HCO₃⁻ = 24 - ${isChronic ? '5' : '2'} × (40 - pCO₂)/10 ± 2`
      };

      if (HCO3 > maxExp) {
        subDisturbances.push("Alcalose Metabólica Associada (queda de HCO₃⁻ menor do que a compensação esperada)");
      } else if (HCO3 < minExp) {
        subDisturbances.push("Acidose Metabólica Associada (queda de HCO₃⁻ maior que a compensação renal esperada)");
      }
    }
  }

  // 5. Cálculo e Avaliação do Anion Gap (Se houver dados de eletrólitos)
  let anionGap: AnionGapDetails = {
    calculated: 0,
    corrected: null,
    classification: 'na',
    valueText: 'Eletrólitos não fornecidos'
  };

  let deltaDelta: DeltaDeltaDetails = {
    ratio: null,
    classification: 'na',
    text: null
  };

  if (Na !== undefined && Cl !== undefined) {
    const rawAG = Na - (Cl + HCO3);
    let correctedAG = rawAG;

    if (Albumin !== undefined) {
      // Corrected AG = Raw AG + 2.5 * (4.0 - Albumin)
      correctedAG = rawAG + 2.5 * (4.0 - Albumin);
      anionGap = {
        calculated: Math.round(rawAG * 10) / 10,
        corrected: Math.round(correctedAG * 10) / 10,
        classification: correctedAG > 12 ? 'high' : 'normal',
        valueText: `Calculado: ${Math.round(rawAG * 10) / 10} mEq/L | Corrigido p/ Albumina: ${Math.round(correctedAG * 10) / 10} mEq/L`
      };
    } else {
      anionGap = {
        calculated: Math.round(rawAG * 10) / 10,
        corrected: null,
        classification: rawAG > 12 ? 'high' : 'normal',
        valueText: `Calculado: ${Math.round(rawAG * 10) / 10} mEq/L (Albumina não informada)`
      };
    }

    if (isMetabolicAcidosis) {
      if (anionGap.classification === 'high') {
        subDisturbances.push("Acidose Metabólica com Anion Gap Elevado (HAGMA)");
        
        // Delta-Delta: (AG_corrigido - 12) / (24 - HCO3)
        const agUsed = correctedAG;
        const deltaAG = agUsed - 12;
        const deltaHCO3 = 24 - HCO3;

        if (deltaHCO3 > 0) {
          const ratio = deltaAG / deltaHCO3;
          let ratioClassification: 'hagma_only' | 'nagma_associated' | 'alkalosis_associated' = 'hagma_only';
          let ratioText = '';

          if (ratio < 0.8) {
            ratioClassification = 'nagma_associated';
            ratioText = `Relação Delta-Delta = ${Math.round(ratio * 100) / 100} (< 0.8). Indica Acidose Metabólica com Anion Gap Normal (NAGMA) associada.`;
            subDisturbances.push("Acidose Metabólica com Anion Gap Normal (NAGMA) Concomitante");
          } else if (ratio > 2.0) {
            ratioClassification = 'alkalosis_associated';
            ratioText = `Relação Delta-Delta = ${Math.round(ratio * 100) / 100} (> 2.0). Indica Alcalose Metabólica associada.`;
            subDisturbances.push("Alcalose Metabólica Concomitante");
          } else {
            ratioText = `Relação Delta-Delta = ${Math.round(ratio * 100) / 100} (0.8 - 2.0). Indica Acidose Metabólica com Anion Gap Elevado pura.`;
          }

          deltaDelta = {
            ratio: Math.round(ratio * 100) / 100,
            classification: ratioClassification,
            text: ratioText
          };
        } else {
          // Delta HCO3 <= 0 indica que o HCO3 observado é igual ou maior que 24.
          // Com AG elevado, isso significa alcalose metabólica severa associada.
          deltaDelta = {
            ratio: null,
            classification: 'alkalosis_associated',
            text: "Bicarbonato normal/alto com Anion Gap elevado. Sugere Alcalose Metabólica associada significativa."
          };
          subDisturbances.push("Alcalose Metabólica Concomitante");
        }
      } else {
        subDisturbances.push("Acidose Metabólica com Anion Gap Normal / Hiperclorêmica (NAGMA)");
      }
    }
  }

  // 6. Oxigenação (Apenas se Arterial)
  let oxygenation: OxygenationDetails = {
    pfRatio: null,
    pfClassification: null,
    aaGradient: null,
    expectedAaGradient: null,
    aaClassification: null
  };

  if (isArterial) {
    const currentFiO2 = FiO2 || 21; // Padrão: Ar ambiente (21%)
    const pf = pO2 / (currentFiO2 / 100);
    let pfClass = '';

    if (pf >= 400) pfClass = 'Normal';
    else if (pf >= 300) pfClass = 'Hipoxemia Leve';
    else if (pf >= 200) pfClass = 'Hipoxemia Moderada';
    else pfClass = 'Hipoxemia Grave';

    let aaGradient: number | null = null;
    let expectedAaGradient: number | null = null;
    let aaClass: string | null = null;

    // Gradiente Alvéolo-Arterial: PAO2 = (FiO2% * 7.13) - (PaCO2 / 0.8)
    // Gradiente = PAO2 - PaO2
    const PAO2 = (currentFiO2 / 100) * 713 - pCO2 / 0.8;
    aaGradient = Math.max(0, PAO2 - pO2);
    aaGradient = Math.round(aaGradient * 10) / 10;

    if (Age !== undefined) {
      expectedAaGradient = Age / 4 + 4;
      expectedAaGradient = Math.round(expectedAaGradient * 10) / 10;
      aaClass = aaGradient > expectedAaGradient ? 'Elevado' : 'Normal';
    } else {
      // Padrão empírico para jovens/adultos normais sem idade informada: normal < 15-20
      aaClass = aaGradient > 15 ? 'Elevado (Sugerido)' : 'Normal (Sugerido)';
    }

    oxygenation = {
      pfRatio: Math.round(pf),
      pfClassification: pfClass,
      aaGradient,
      expectedAaGradient,
      aaClassification: aaClass
    };
  }

  // 7. Geração de Condutas Médicas Baseadas em Evidências
  // Adiciona condutas com base no perfil de distúrbio primário e subdistúrbios
  if (isMetabolicAcidosis) {
    const isHagma = anionGap.classification === 'high';

    if (isHagma) {
      condutas.push(
        "Investigar e tratar causa de HAGMA: Cetoacidose diabética (CAD), Uremia/Insuficiência Renal, Acidose Láctica (choque/sepse), ou Intoxicações (salicilatos, metanol, etilenoglicol).",
        "Acidose Láctica/Choque: Priorizar ressuscitação hemodinâmica (cristaloides balanceados, vasopressores) e tratamento infeccioso precoce (antibióticos). Evite bicarbonato de rotina.",
        "Cetoacidose Diabética: Priorizar expansão volêmica e insulinoterapia com reposição concomitante de Potássio. Evite bicarbonato, exceto se pH < 6.9.",
        "Reposição de Bicarbonato de Sódio: Altamente controversa. Considerar apenas em acidose mineral severa se pH < 7.10 (ou < 7.20 em lesão renal aguda severa AKIN 3) visando elevar o pH para 7.20."
      );
    } else {
      condutas.push(
        "Investigar causas de NAGMA (Acidose Hiperclorêmica): Perdas gastrointestinais (diarreia, fístulas), Acidose Tubular Renal (ATR), ou infusão excessiva de Soro Fisiológico 0.9%.",
        "Hipercloremia por SF 0.9%: Substituir expansão volêmica por soluções balanceadas (ex: Ringer Lactato ou Plasma-Lyte).",
        "Perda de Bicarbonato: Reposição de bicarbonato de sódio pode ser considerada se pH < 7.15-7.20 ou HCO₃⁻ < 10-12 mEq/L, repondo metade do déficit estimado lentamente."
      );
    }
  }

  if (isMetabolicAlkalosis) {
    condutas.push(
      "Alcalose Metabólica: Avaliar volemia do paciente e Cloro urinário.",
      "Causa responsiva ao Cloro (Vômitos, sonda nasogástrica, diuréticos): Tratamento de escolha é a reposição volêmica com Soro Fisiológico (NaCl 0.9%) para repor cloro e sódio e induzir bicarbonatúria.",
      "Causa resistente ao Cloro (Mineralocorticoide alto, hipocalemia grave): Tratar causa de base. Corrigir obrigatoriamente a hipocalemia (o potássio baixo impede a reabsorção de H⁺ e perpetua a alcalose).",
      "Alcalose Severa (pH > 7.55): Se houver risco de arritmias ou convulsões, considerar Acetazolamida (250-500mg IV) para inibir a anidrase carbônica renal e forçar excreção de HCO₃⁻."
    );
  }

  if (isRespiratoryAcidosis) {
    condutas.push(
      "Garantir patência da via aérea e oxigenação adequada.",
      "Acidose Respiratória Aguda: Tratar causa primária de hipoventilação (broncoespasmo, edema pulmonar, overdose de sedativos, fraqueza neuromuscular).",
      "DPOC Exacerbado / Hipoventilação: Considerar Ventilação Não Invasiva (VNI/BiPAP) se pH < 7.30 e pCO₂ > 45 mmHg com estabilidade clínica.",
      "DPOC/Retentores Crônicos: Evite normalizar rapidamente a pCO₂ na ventilação mecânica para não causar alcalose metabólica severa rebote (pós-hipercapnia) e convulsões.",
      "Instabilidade / Rebaixamento do Sensório: Indicação de intubação traqueal e ventilação mecânica invasiva."
    );
  }

  if (isRespiratoryAlkalosis) {
    condutas.push(
      "Alcalose Respiratória Aguda: Investigar dor, ansiedade, febre, sepse precoce, embolia pulmonar ou hiperventilação iatrogênica em ventilação mecânica.",
      "Crise de Ansiedade/Hiperventilação: Reassurar o paciente e instituir exercícios de respiração lenta e diafragmática. Evite o uso prolongado de sacos de papel para evitar hipóxia severa.",
      "Em Ventilação Mecânica: Diminuir o volume minuto do ventilador (reduzir frequência respiratória ou volume corrente)."
    );
  }

  // Se houver distúrbios associados específicos, adicionar condutas complementares
  if (subDisturbances.length > 0) {
    if (subDisturbances.some(d => d.includes("Alcalose Metabólica Concomitante") || d.includes("Alcalose Metabólica Associada"))) {
      condutas.push("Atenção: Há Alcalose Metabólica associada. Monitorar potássio sérico (risco de hipocalemia severa por shift intracelular).");
    }
    if (subDisturbances.some(d => d.includes("Acidose Respiratória Associada"))) {
      condutas.push("Alerta: Acidose respiratória associada ao distúrbio metabólico. Indica fadiga ventilatória iminente ou distúrbio respiratório primário concomitante.");
    }
  }

  // Garantir condutas únicas e ordenadas
  const uniqueCondutas = Array.from(new Set(condutas));

  return {
    phClassification,
    primaryDisorder,
    subDisturbances,
    compensation,
    anionGap,
    deltaDelta,
    oxygenation,
    condutas: uniqueCondutas,
    warnings
  };
}
