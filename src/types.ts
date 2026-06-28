export type ExamType = 'arterial' | 'venous';

export interface BloodGasInputs {
  type: ExamType;
  pH: number;      // pH unitless
  pCO2: number;    // mmHg
  pO2: number;     // mmHg
  HCO3: number;    // mEq/L
  BE: number;      // mEq/L
  SatO2: number;   // %
  
  // Optional Electrolytes & Proteins
  Na?: number;     // mEq/L
  Cl?: number;     // mEq/L
  K?: number;      // mEq/L
  Albumin?: number; // g/dL
  
  // Optional Oxygenation/Age variables
  FiO2?: number;   // percentage (e.g. 21 for room air, or 0.21 - let's standardise as % like 21)
  Age?: number;    // years
}

export interface CompensationDetails {
  isCompensated: boolean;
  status: 'adequate' | 'insufficient' | 'excessive' | 'na';
  observed: number;
  expectedMin: number;
  expectedMax: number;
  expectedValueText: string;
  formulaUsed: string;
}

export interface AnionGapDetails {
  calculated: number;
  corrected: number | null;
  classification: 'high' | 'normal' | 'na';
  valueText: string;
}

export interface DeltaDeltaDetails {
  ratio: number | null;
  classification: 'hagma_only' | 'nagma_associated' | 'alkalosis_associated' | 'na';
  text: string | null;
}

export interface OxygenationDetails {
  pfRatio: number | null; // PaO2 / FiO2
  pfClassification: string | null;
  aaGradient: number | null; // Alveolar-arterial Gradient
  expectedAaGradient: number | null;
  aaClassification: string | null;
}

export interface InterpretationResult {
  phClassification: 'Acidemia' | 'Alcalemia' | 'Normal';
  primaryDisorder: string;
  subDisturbances: string[];
  compensation: CompensationDetails;
  anionGap: AnionGapDetails;
  deltaDelta: DeltaDeltaDetails;
  oxygenation: OxygenationDetails;
  condutas: string[];
  warnings: string[];
}

export interface SavedExam {
  id: string;
  patientName: string;
  date: string;
  inputs: BloodGasInputs;
  result: InterpretationResult;
}
