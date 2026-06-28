import type { BloodGasInputs } from '../types';

/**
 * Realiza o parsing do texto extraído pelo OCR (Tesseract) para encontrar parâmetros da gasometria.
 */
export function parseOcrText(text: string): Partial<BloodGasInputs> {
  const result: Partial<BloodGasInputs> = {};
  const normalizedText = text.toLowerCase().replace(/,/g, '.');

  // Regex helpers
  const findValue = (patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
      const match = normalizedText.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          return val;
        }
      }
    }
    return undefined;
  };

  // pH: normalmente entre 6.8 e 7.8
  const phVal = findValue([
    /ph\s*[:=\s]\s*(\d\.\d{2,3})/i,
    /\b(7\.\d{2,3}|6\.\d{2,3})\b/i
  ]);
  if (phVal && phVal >= 6.5 && phVal <= 8.0) {
    result.pH = phVal;
  }

  // pCO2: normalmente entre 10 e 150 mmHg
  const pco2Val = findValue([
    /pco2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i,
    /pc02\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i,
    /pco\s*2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i,
    /pressao\s+parcial\s+de\s+co2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i
  ]);
  if (pco2Val && pco2Val >= 5 && pco2Val <= 180) {
    result.pCO2 = pco2Val;
  }

  // pO2: normalmente entre 10 e 300 mmHg
  const po2Val = findValue([
    /po2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i,
    /po\s*2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i,
    /pressao\s+parcial\s+de\s+o2\s*[:=\s]\s*(\d{2,3}(\.\d)?)/i
  ]);
  if (po2Val && po2Val >= 5 && po2Val <= 600) {
    result.pO2 = po2Val;
  }

  // HCO3 (Bicarbonato): normalmente entre 2 e 60 mEq/L
  const hco3Val = findValue([
    /hco3\s*[:=\s]\s*(\d{1,2}(\.\d)?)/i,
    /hc03\s*[:=\s]\s*(\d{1,2}(\.\d)?)/i,
    /hco\s*3\s*[:=\s]\s*(\d{1,2}(\.\d)?)/i,
    /bicarbonato\s*[:=\s]\s*(\d{1,2}(\.\d)?)/i,
    /hco3-act\s*[:=\s]\s*(\d{1,2}(\.\d)?)/i
  ]);
  if (hco3Val && hco3Val >= 1 && hco3Val <= 60) {
    result.HCO3 = hco3Val;
  }

  // Base Excess (BE)
  const beVal = findValue([
    /\bbe\b\s*[:=\s]\s*([-+]?\d{1,2}(\.\d)?)/i,
    /base\s+excess\s*[:=\s]\s*([-+]?\d{1,2}(\.\d)?)/i,
    /excesso\s+de\s+base\s*[:=\s]\s*([-+]?\d{1,2}(\.\d)?)/i,
    /\beb\b\s*[:=\s]\s*([-+]?\d{1,2}(\.\d)?)/i
  ]);
  if (beVal !== undefined && beVal >= -40 && beVal <= 40) {
    result.BE = beVal;
  }

  // SatO2 (Saturação de O2)
  const sato2Val = findValue([
    /sato2\s*[:=\s]\s*(\d{2,3})/i,
    /sat\s*o2\s*[:=\s]\s*(\d{2,3})/i,
    /so2\s*[:=\s]\s*(\d{2,3})/i,
    /saturacao\s+de\s+o2\s*[:=\s]\s*(\d{2,3})/i
  ]);
  if (sato2Val && sato2Val >= 20 && sato2Val <= 100) {
    result.SatO2 = sato2Val;
  }

  // Eletrólitos: Na+, Cl-, K+
  const naVal = findValue([
    /\bna\b\s*[:=\s]\s*(\d{3})/i,
    /sodio\s*[:=\s]\s*(\d{3})/i,
    /\bna\+\b\s*[:=\s]\s*(\d{3})/i
  ]);
  if (naVal && naVal >= 100 && naVal <= 180) {
    result.Na = naVal;
  }

  const clVal = findValue([
    /\bcl\b\s*[:=\s]\s*(\d{2,3})/i,
    /cloro\s*[:=\s]\s*(\d{2,3})/i,
    /\bcl-\b\s*[:=\s]\s*(\d{2,3})/i
  ]);
  if (clVal && clVal >= 50 && clVal <= 150) {
    result.Cl = clVal;
  }

  const kVal = findValue([
    /\bk\b\s*[:=\s]\s*(\d\.\d)/i,
    /potassio\s*[:=\s]\s*(\d\.\d)/i,
    /\bk\+\b\s*[:=\s]\s*(\d\.\d)/i
  ]);
  if (kVal && kVal >= 1.0 && kVal <= 10.0) {
    result.K = kVal;
  }

  // Detecta se o exame é venoso por palavras-chave
  const containsVenousKeywords = normalizedText.includes('venos') || 
                                 normalizedText.includes('vbg') || 
                                 normalizedText.includes('sangue venoso');
  result.type = containsVenousKeywords ? 'venous' : 'arterial';

  return result;
}
