import type { BloodGasInputs, InterpretationResult } from '../types';
import {
  CheckSquare,
  Activity,
  ArrowLeft,
  Heart,
  ShieldAlert,
  Percent,
  Droplet
} from 'lucide-react';

interface ResultsViewProps {
  inputs: BloodGasInputs;
  result: InterpretationResult;
  patientName: string;
  onBack: () => void;
}

export const ResultsView = ({
  inputs,
  result,
  patientName,
  onBack
}: ResultsViewProps) => {
  const { pH, type } = inputs;
  const { phClassification, primaryDisorder, subDisturbances, compensation, anionGap, deltaDelta, oxygenation, condutas, warnings } = result;

  const isArterial = inputs.type === 'arterial';

  // Helper para decidir a classe de cores com base no diagnóstico
  const getDisorderClass = () => {
    if (primaryDisorder.includes('Normal')) return 'active-normal';
    if (primaryDisorder.includes('Acidose') || primaryDisorder.includes('Acidemia')) return 'active-arterial';
    if (primaryDisorder.includes('Alcalose') || primaryDisorder.includes('Alcalemia')) return 'active-alkalosis';
    return 'active-warning';
  };

  // Cálculo da posição no slider de Davenport simplificado (pH de 6.8 a 7.8)
  // O meio é 7.40. Vamos mapear de 0% a 100%
  const calculateMarkerPosition = () => {
    const minPh = 6.8;
    const maxPh = 7.8;
    const position = ((pH - minPh) / (maxPh - minPh)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Botão de Voltar */}
      <div>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '10px 16px' }}>
          <ArrowLeft size={16} /> Alterar Dados
        </button>
      </div>

      {/* 1. Header do Paciente e Tipo de Exame */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Paciente</h4>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{patientName}</h3>
          </div>
          <div className={`status-badge ${isArterial ? 'arterial' : 'venous'}`}>
            {isArterial ? "Sangue Arterial" : "Sangue Venoso"}
          </div>
        </div>
      </div>

      {/* 2. Diagnóstico Principal */}
      <div className={`glass-card ${getDisorderClass()}`} style={{ padding: '20px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Diagnóstico Gasométrico
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '4px', marginBottom: '8px', lineHeight: 1.3 }}>
          {primaryDisorder}
        </h2>
        
        {phClassification !== 'Normal' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span className={`status-badge ${phClassification === 'Acidemia' ? 'arterial' : 'alkalosis'}`} style={{ fontSize: '11px', padding: '4px 8px' }}>
              {phClassification}
            </span>
            {subDisturbances.map((dist, idx) => (
              <span key={idx} className="status-badge warning" style={{ fontSize: '11px', padding: '4px 8px' }}>
                {dist}
              </span>
            ))}
          </div>
        )}

        {/* Diagrama Davenport Simplificado */}
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span>Acidemia</span>
            <span style={{ color: 'var(--color-normal)', fontWeight: 600 }}>Normal ({type === 'arterial' ? '7.35-7.45' : '7.31-7.41'})</span>
            <span>Alcalemia</span>
          </div>
          <div className="davenport-diagram">
            <div className="davenport-marker" style={{ left: `${calculateMarkerPosition()}%` }}></div>
          </div>
          <div className="davenport-labels">
            <span>6.80</span>
            <span>7.10</span>
            <span>7.40</span>
            <span>7.60</span>
            <span>7.80</span>
          </div>
        </div>
      </div>

      {/* 3. Avisos e Alertas Clínicos Críticos */}
      {warnings.length > 0 && (
        <div className="glass-card active-warning" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={18} color="var(--color-warning)" />
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-warning)' }}>Alertas Clínicos de Segurança</h4>
          </div>
          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {warnings.map((w, idx) => (
              <li key={idx} style={{ lineHeight: 1.4 }}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Avaliação de Compensação Fisiológica */}
      {compensation.status !== 'na' && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--primary)" /> Compensação Fisiológica
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Parâmetro Observado:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {inputs.type === 'arterial' ? 'pCO₂' : 'pCO₂'} = {compensation.observed} mmHg
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Intervalo Esperado:</span>
              <strong style={{ color: 'var(--color-normal)' }}>{compensation.expectedValueText}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status de Compensação:</span>
              <strong style={{ 
                color: compensation.status === 'adequate' ? 'var(--color-normal)' : 'var(--color-warning)' 
              }}>
                {compensation.status === 'adequate' && "Adequada / Esperada"}
                {compensation.status === 'insufficient' && "Insuficiente (Distúrbio Misto)"}
                {compensation.status === 'excessive' && "Excessiva (Distúrbio Misto)"}
              </strong>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px', lineHeight: 1.3 }}>
              * Baseado em: {compensation.formulaUsed}
            </p>
          </div>
        </div>
      )}

      {/* 5. Avaliação do Anion Gap e Delta-Delta */}
      {anionGap.classification !== 'na' && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={16} color="var(--color-venous)" /> Anion Gap & Eletrólitos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Anion Gap Calculado:</span>
              <strong>{anionGap.calculated} mEq/L</strong>
            </div>
            {anionGap.corrected !== null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Corrigido p/ Albumina:</span>
                <strong style={{ color: anionGap.classification === 'high' ? 'var(--color-arterial)' : 'var(--color-normal)' }}>
                  {anionGap.corrected} mEq/L
                </strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Classificação:</span>
              <strong style={{ color: anionGap.classification === 'high' ? 'var(--color-arterial)' : 'var(--color-normal)' }}>
                {anionGap.classification === 'high' ? 'Elevado (HAGMA)' : 'Normal (NAGMA)'}
              </strong>
            </div>

            {/* Relação Delta-Delta (se HAGMA) */}
            {deltaDelta.classification !== 'na' && deltaDelta.text && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginTop: '6px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  RELAÇÃO DELTA-DELTA (ΔAG / ΔHCO₃⁻)
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{deltaDelta.text}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Oxigenação Arterial (A-a Gradient e PF Ratio) */}
      {isArterial && oxygenation.pfRatio !== null && (
        <div className="glass-card" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent size={16} color="var(--color-arterial)" /> Oxigenação & Troca Gasosa
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Relação PaO₂/FiO₂:</span>
              <strong style={{ 
                color: oxygenation.pfClassification === 'Normal' ? 'var(--color-normal)' : 'var(--color-arterial)' 
              }}>
                {oxygenation.pfRatio} ({oxygenation.pfClassification})
              </strong>
            </div>
            
            {oxygenation.aaGradient !== null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gradiente Alvéolo-Arterial (A-a):</span>
                  <strong>{oxygenation.aaGradient} mmHg</strong>
                </div>
                {oxygenation.expectedAaGradient !== null && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Gradiente Esperado para Idade:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>&lt; {oxygenation.expectedAaGradient} mmHg</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Classificação do Gradiente:</span>
                  <strong style={{ 
                    color: oxygenation.aaClassification?.includes('Elevado') ? 'var(--color-arterial)' : 'var(--color-normal)' 
                  }}>
                    {oxygenation.aaClassification}
                  </strong>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 7. Condutas e Recomendações Terapêuticas */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <CheckSquare size={18} color="var(--color-normal)" /> Condutas Recomendadas
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {condutas.map((conduta, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--color-normal)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}>
                <Heart size={12} fill="var(--color-normal)" />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {conduta}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Aviso Médico / Disclaimer */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        background: 'rgba(245, 158, 11, 0.05)',
        border: '1px solid rgba(245, 158, 11, 0.18)',
        borderRadius: 'var(--radius-md)',
        padding: '14px'
      }}>
        <ShieldAlert size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Aviso:</strong> Esta é uma ferramenta de <strong>apoio à decisão</strong> e
          fins educacionais. Os cálculos e condutas seguem fórmulas e diretrizes consagradas (Marino, West, ATS/ERS),
          mas <strong>não substituem o julgamento clínico</strong>, o exame do paciente nem a correlação com a história e demais exames.
          Confira os valores inseridos e a coerência do resultado antes de qualquer decisão terapêutica.
          A responsabilidade pela conduta é sempre do profissional assistente.
        </p>
      </div>

    </div>
  );
};
