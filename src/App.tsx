import { useState } from 'react';
import type { BloodGasInputs, InterpretationResult } from './types';
import { interpretBloodGas } from './utils/clinicalMath';
import { Header } from './components/Header';
import { ExamInput } from './components/ExamInput';
import { ResultsView } from './components/ResultsView';
import { ShieldAlert } from 'lucide-react';

function App() {
  // Estado do exame ativo em análise
  const [activeInputs, setActiveInputs] = useState<BloodGasInputs | null>(null);
  const [activePatientName, setActivePatientName] = useState<string>('Paciente Anônimo');
  const [activeResult, setActiveResult] = useState<InterpretationResult | null>(null);

  // Interpreta os dados inseridos no formulário
  const handleInputSubmit = (inputs: BloodGasInputs, patientName: string) => {
    const result = interpretBloodGas(inputs);
    setActiveInputs(inputs);
    setActivePatientName(patientName);
    setActiveResult(result);
  };

  // Volta da tela de resultados para o formulário (mantém os valores inseridos)
  const handleBackToInputs = () => {
    setActiveResult(null);
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="main-content">
        {activeResult && activeInputs ? (
          <ResultsView
            inputs={activeInputs}
            result={activeResult}
            patientName={activePatientName}
            onBack={handleBackToInputs}
          />
        ) : (
          <ExamInput
            onSubmit={handleInputSubmit}
            initialInputs={activeInputs}
          />
        )}

        {/* Aviso permanente na tela de entrada
            (a tela de resultados já exibe o aviso detalhado) */}
        {!activeResult && (
          <footer style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            <ShieldAlert size={13} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Ferramenta de apoio à decisão clínica.</strong> A
              interpretação e a <strong>decisão final são de responsabilidade do profissional de saúde</strong>,
              considerando o exame físico, a história e o contexto do paciente. Não substitui o julgamento médico.
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

export default App;
