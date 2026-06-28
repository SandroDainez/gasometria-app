import { useState, useEffect } from 'react';
import type { BloodGasInputs, ExamType } from '../types';
import { CLINICAL_TEST_CASES } from '../utils/mockData';
import { Activity, User, Plus, ArrowRight } from 'lucide-react';

interface ExamInputProps {
  onSubmit: (inputs: BloodGasInputs, patientName: string) => void;
  initialInputs?: BloodGasInputs | null;
}

interface ValueInputProps {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
  abnormal?: boolean; // undefined = sem destaque de cor (ex: pO₂, SatO₂)
}

/**
 * Campo numérico editável por digitação, sincronizado com o slider.
 * Mantém um rascunho em texto para permitir digitar decimais (ex: "7.28")
 * e valores fora da faixa do slider (casos graves) sem travar a edição.
 */
const ValueInput: React.FC<ValueInputProps> = ({ value, onChange, ariaLabel, abnormal }) => {
  const [draft, setDraft] = useState<string>(String(value));

  // Sincroniza o rascunho quando o valor externo muda (slider, preset, OCR)
  useEffect(() => {
    if (parseFloat(draft) !== value) setDraft(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const colorClass = abnormal === undefined ? '' : abnormal ? ' abnormal' : ' normal';

  return (
    <input
      type="text"
      inputMode="decimal"
      aria-label={ariaLabel}
      className={`slider-value-badge${colorClass}`}
      style={{ width: '80px', textAlign: 'right', fontFamily: 'monospace', cursor: 'text' }}
      value={draft}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        const v = parseFloat(raw);
        if (!Number.isNaN(v)) onChange(v);
      }}
      onBlur={() => {
        const v = parseFloat(draft);
        setDraft(Number.isNaN(v) ? String(value) : String(v));
      }}
    />
  );
};

export const ExamInput: React.FC<ExamInputProps> = ({ onSubmit, initialInputs }) => {
  const [patientName, setPatientName] = useState('');
  const [type, setType] = useState<ExamType>('arterial');
  
  // Parâmetros obrigatórios
  const [pH, setPh] = useState(7.40);
  const [pCO2, setPco2] = useState(40);
  const [pO2, setPo2] = useState(90);
  const [HCO3, setHco3] = useState(24);
  const [BE, setBe] = useState(0);
  const [SatO2, setSatO2] = useState(98);

  // Parâmetros opcionais (Eletrólitos e Oxigenação)
  const [showOptional, setShowOptional] = useState(false);
  const [Na, setNa] = useState<number | undefined>(undefined);
  const [Cl, setCl] = useState<number | undefined>(undefined);
  const [K, setK] = useState<number | undefined>(undefined);
  const [Albumin, setAlbumin] = useState<number | undefined>(undefined);
  const [FiO2, setFiO2] = useState<number | undefined>(undefined);
  const [Age, setAge] = useState<number | undefined>(undefined);

  // Carrega inputs iniciais (ex: vindos de OCR ou do histórico)
  useEffect(() => {
    if (initialInputs) {
      setType(initialInputs.type);
      setPh(initialInputs.pH);
      setPco2(initialInputs.pCO2);
      setPo2(initialInputs.pO2);
      setHco3(initialInputs.HCO3);
      setBe(initialInputs.BE);
      setSatO2(initialInputs.SatO2);
      
      setNa(initialInputs.Na);
      setCl(initialInputs.Cl);
      setK(initialInputs.K);
      setAlbumin(initialInputs.Albumin);
      setFiO2(initialInputs.FiO2);
      setAge(initialInputs.Age);

      if (initialInputs.Na !== undefined || initialInputs.FiO2 !== undefined || initialInputs.Age !== undefined) {
        setShowOptional(true);
      }
    }
  }, [initialInputs]);

  // Adapta valores iniciais se o tipo mudar
  const handleTypeChange = (newType: ExamType) => {
    setType(newType);
    if (newType === 'venous') {
      setPh(7.35);
      setPco2(46);
      setPo2(35);
      setSatO2(70);
    } else {
      setPh(7.40);
      setPco2(40);
      setPo2(90);
      setSatO2(98);
    }
  };

  const loadTestCase = (inputs: BloodGasInputs) => {
    setType(inputs.type);
    setPh(inputs.pH);
    setPco2(inputs.pCO2);
    setPo2(inputs.pO2);
    setHco3(inputs.HCO3);
    setBe(inputs.BE);
    setSatO2(inputs.SatO2);
    
    setNa(inputs.Na);
    setCl(inputs.Cl);
    setK(inputs.K);
    setAlbumin(inputs.Albumin);
    setFiO2(inputs.FiO2);
    setAge(inputs.Age);

    if (inputs.Na !== undefined || inputs.FiO2 !== undefined || inputs.Age !== undefined) {
      setShowOptional(true);
    } else {
      setShowOptional(false);
    }
  };

  const handleInterpret = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      pH,
      pCO2,
      pO2,
      HCO3,
      BE,
      SatO2,
      Na,
      Cl,
      K,
      Albumin,
      FiO2,
      Age
    }, patientName.trim() || "Paciente Anônimo");
  };

  // Helper para verificar se o valor está fora do intervalo normal
  const isAbnormal = (val: number, min: number, max: number) => val < min || val > max;

  // Limites normais para exibição de alertas visuais nos badges
  const isPhAbnormal = isAbnormal(pH, type === 'arterial' ? 7.35 : 7.31, type === 'arterial' ? 7.45 : 7.41);
  const isPco2Abnormal = isAbnormal(pCO2, type === 'arterial' ? 35 : 41, type === 'arterial' ? 45 : 51);
  const isHco3Abnormal = isAbnormal(HCO3, type === 'arterial' ? 22 : 22, type === 'arterial' ? 26 : 28);
  const isBeAbnormal = BE < -2 || BE > 2;

  return (
    <form onSubmit={handleInterpret} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Nome do Paciente e Tipo de Exame */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <User size={14} color="var(--primary)" /> Identificação do Paciente (Opcional)
            </label>
            <input 
              type="text" 
              className="text-input" 
              placeholder="Ex: J.S.O. ou Leito 4" 
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
              Tipo de Sangue
            </label>
            <div className="tab-container" style={{ marginBottom: 0 }}>
              <button 
                type="button" 
                className={`tab-btn ${type === 'arterial' ? 'active' : ''}`}
                onClick={() => handleTypeChange('arterial')}
                style={type === 'arterial' ? { backgroundColor: 'var(--color-arterial)', boxShadow: '0 4px 10px var(--color-arterial-glow)' } : {}}
              >
                Arterial
              </button>
              <button 
                type="button" 
                className={`tab-btn ${type === 'venous' ? 'active' : ''}`}
                onClick={() => handleTypeChange('venous')}
                style={type === 'venous' ? { backgroundColor: 'var(--color-venous)', boxShadow: '0 4px 10px var(--color-venous-glow)' } : {}}
              >
                Venoso
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Casos Clínicos de Exemplo (Presets) */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} color="var(--primary)" /> Simulador de Casos Clínicos Reais
        </h4>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '6px',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none'
        }}>
          {CLINICAL_TEST_CASES.map((tc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadTestCase(tc.inputs)}
              style={{
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {tc.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Sliders de Parâmetros Ácido-Base */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          Parâmetros Ácido-Base
        </h4>

        {/* Slider pH */}
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">pH</span>
            <ValueInput value={pH} onChange={setPh} ariaLabel="pH" abnormal={isPhAbnormal} />
          </div>
          <div className="slider-wrapper">
            <input 
              type="range" 
              min="6.80" 
              max="7.80" 
              step="0.01" 
              value={pH}
              onChange={(e) => setPh(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Slider pCO2 */}
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">pCO₂ <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(mmHg)</span></span>
            <ValueInput value={pCO2} onChange={setPco2} ariaLabel="pCO2 em mmHg" abnormal={isPco2Abnormal} />
          </div>
          <div className="slider-wrapper">
            <input
              type="range"
              min="10"
              max="150"
              step="1"
              value={pCO2}
              onChange={(e) => setPco2(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Slider HCO3 */}
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">HCO₃⁻ <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(mEq/L)</span></span>
            <ValueInput value={HCO3} onChange={setHco3} ariaLabel="HCO3 em mEq/L" abnormal={isHco3Abnormal} />
          </div>
          <div className="slider-wrapper">
            <input 
              type="range" 
              min="2.0" 
              max="50.0" 
              step="0.5" 
              value={HCO3}
              onChange={(e) => setHco3(parseFloat(e.target.value))}
            />
          </div>
        </div>

        {/* Slider BE (Base Excess) */}
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">Base Excess (BE) <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(mEq/L)</span></span>
            <ValueInput value={BE} onChange={setBe} ariaLabel="Base Excess em mEq/L" abnormal={isBeAbnormal} />
          </div>
          <div className="slider-wrapper">
            <input 
              type="range" 
              min="-30" 
              max="30" 
              step="1" 
              value={BE}
              onChange={(e) => setBe(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Slider pO2 */}
        <div className="slider-group">
          <div className="slider-header">
            <span className="slider-label">pO₂ <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(mmHg)</span></span>
            <ValueInput value={pO2} onChange={setPo2} ariaLabel="pO2 em mmHg" />
          </div>
          <div className="slider-wrapper">
            <input
              type="range"
              min="10"
              max="400"
              step="1"
              value={pO2}
              onChange={(e) => setPo2(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Slider SatO2 */}
        <div className="slider-group" style={{ marginBottom: 0 }}>
          <div className="slider-header">
            <span className="slider-label">SatO₂ <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(%)</span></span>
            <ValueInput value={SatO2} onChange={setSatO2} ariaLabel="Saturação de O2 em %" />
          </div>
          <div className="slider-wrapper">
            <input 
              type="range" 
              min="30" 
              max="100" 
              step="1" 
              value={SatO2}
              onChange={(e) => setSatO2(parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* 4. Parâmetros Opcionais (Eletrólitos/Oxigenação) */}
      <div className="glass-card" style={{ padding: '18px' }}>
        <button
          type="button"
          onClick={() => setShowOptional(!showOptional)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Parâmetros Avançados/Eletrólitos</span>
          <span style={{
            fontSize: '18px',
            color: 'var(--primary)',
            transition: 'transform 0.2s',
            transform: showOptional ? 'rotate(45deg)' : 'rotate(0)'
          }}>
            <Plus size={18} />
          </span>
        </button>

        {showOptional && (
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', animation: 'slideUp 0.3s ease-out' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              * Fornecer Na⁺ e Cl⁻ habilita o cálculo do **Anion Gap**. Fornecer Albumina permite o **Anion Gap corrigido** e a análise do **Delta-Delta** em acidoses.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Na⁺ <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(mEq/L)</span></label>
                <input 
                  type="number" 
                  className="text-input" 
                  placeholder="Ex: 140" 
                  value={Na !== undefined ? Na : ''} 
                  onChange={(e) => setNa(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Cl⁻ <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(mEq/L)</span></label>
                <input 
                  type="number" 
                  className="text-input" 
                  placeholder="Ex: 104" 
                  value={Cl !== undefined ? Cl : ''} 
                  onChange={(e) => setCl(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>K⁺ <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(mEq/L)</span></label>
                <input 
                  type="number" 
                  className="text-input" 
                  placeholder="Ex: 4.0" 
                  value={K !== undefined ? K : ''} 
                  onChange={(e) => setK(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Albumina <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(g/dL)</span></label>
                <input 
                  type="number" 
                  step="0.1"
                  className="text-input" 
                  placeholder="Ex: 4.0" 
                  value={Albumin !== undefined ? Albumin : ''} 
                  onChange={(e) => setAlbumin(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>FiO₂ <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(%)</span></label>
                <input 
                  type="number" 
                  min="21"
                  max="100"
                  className="text-input" 
                  placeholder="Ex: 21 (Ar Amb.)" 
                  value={FiO2 !== undefined ? FiO2 : ''} 
                  onChange={(e) => setFiO2(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Idade <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(anos)</span></label>
                <input 
                  type="number" 
                  className="text-input" 
                  placeholder="Ex: 45" 
                  value={Age !== undefined ? Age : ''} 
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
              * Fornecer FiO₂ (e Idade opcional) habilita o cálculo da relação **PaO₂/FiO₂** e do **Gradiente Alvéolo-Arterial** de oxigênio em gasometrias arteriais.
            </p>
          </div>
        )}
      </div>

      {/* Botão de Enviar */}
      <button 
        type="submit" 
        className="btn-primary pulsing-effect" 
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          fontSize: '16px',
          fontWeight: 700,
          boxShadow: '0 8px 30px var(--primary-glow)',
          marginTop: '10px'
        }}
      >
        Interpretar Gasometria <ArrowRight size={18} />
      </button>

    </form>
  );
};
