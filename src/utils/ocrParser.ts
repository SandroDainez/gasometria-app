import type { BloodGasInputs } from '../types';

/**
 * Realiza o parsing do texto extraído pelo OCR (Tesseract) para encontrar parâmetros da gasometria.
 * Tolerante a separadores variados (":", "=", espaço, unidades no meio), prefixos "Pa" (PaCO₂/PaO₂)
 * e sinônimos comuns (bicarbonato/bic, sódio/Na, etc.).
 */
export function parseOcrText(text: string): Partial<BloodGasInputs> {
  const result: Partial<BloodGasInputs> = {};
  // Normaliza: minúsculas e vírgula decimal -> ponto
  const t = text.toLowerCase().replace(/,/g, '.');

  // Captura o primeiro número que aparece logo após um rótulo, tolerando até `gap`
  // caracteres não numéricos no meio (espaços, ":", "=", unidades). O número é o
  // primeiro a aparecer — em laudos a faixa de referência vem depois do valor.
  const grab = (
    label: RegExp,
    opts?: { decimals?: boolean; sign?: boolean; gap?: number }
  ): number | undefined => {
    const gap = opts?.gap ?? 10;
    const sign = opts?.sign ? '[-+]?' : '';
    const num = opts?.decimals ? '\\d{1,3}(?:\\.\\d{1,2})?' : '\\d{1,3}';
    // Lazy ({0,gap}?) para o sinal (−/+) ficar com o número, e não ser consumido pelo "buraco"
    const re = new RegExp(`${label.source}[^\\d\\n]{0,${gap}}?(${sign}${num})`, 'i');
    const m = t.match(re);
    if (!m) return undefined;
    const v = parseFloat(m[1]);
    return Number.isNaN(v) ? undefined : v;
  };

  // pH — rótulo, ou fallback para um número típico de pH solto (6.xx / 7.xx)
  let ph = grab(/\bph/, { decimals: true });
  if (ph === undefined) {
    const m = t.match(/\b([67]\.\d{2,3})\b/);
    if (m) ph = parseFloat(m[1]);
  }
  if (ph !== undefined && ph >= 6.5 && ph <= 8.0) result.pH = ph;

  // pCO₂ / PaCO₂ (\b evita casar dentro de outras palavras)
  const pco2 = grab(/\bpa?c[o0]\s*2/, { decimals: true });
  if (pco2 !== undefined && pco2 >= 5 && pco2 <= 180) result.pCO2 = pco2;

  // pO₂ / PaO₂ (não casa "pco2" pois exige p seguido de o/0, nem "spo2" pelo \b)
  const po2 = grab(/\bpa?[o0]\s*2/, { decimals: true });
  if (po2 !== undefined && po2 >= 5 && po2 <= 600) result.pO2 = po2;

  // HCO₃ / bicarbonato / bic
  const hco3 = grab(/\b(?:hc[o0]\s*3|bicarbonato|bic)/, { decimals: true });
  if (hco3 !== undefined && hco3 >= 1 && hco3 <= 60) result.HCO3 = hco3;

  // Base Excess
  const be = grab(/\b(?:be|eb|base\s+excess|excesso\s+de\s+base)\b/, { decimals: true, sign: true });
  if (be !== undefined && be >= -40 && be <= 40) result.BE = be;

  // SatO₂
  const sat = grab(/\b(?:sat\s*o2|s[o0]2|saturacao\s+de\s+o2)/);
  if (sat !== undefined && sat >= 20 && sat <= 100) result.SatO2 = sat;

  // Na⁺
  const na = grab(/\b(?:na\b\+?|sodio)/);
  if (na !== undefined && na >= 100 && na <= 180) result.Na = na;

  // Cl⁻
  const cl = grab(/\b(?:cl\b-?|cloro)/);
  if (cl !== undefined && cl >= 50 && cl <= 150) result.Cl = cl;

  // K⁺
  const k = grab(/\b(?:k\b\+?|potassio)/, { decimals: true });
  if (k !== undefined && k >= 1.0 && k <= 10.0) result.K = k;

  // Detecta se o exame é venoso por palavras-chave
  const venous = t.includes('venos') || t.includes('vbg') || t.includes('sangue venoso');
  result.type = venous ? 'venous' : 'arterial';

  return result;
}
