import { useState, useEffect } from 'react';
import type { BloodGasInputs, SavedExam, InterpretationResult } from './types';
import { interpretBloodGas } from './utils/clinicalMath';
import { Header } from './components/Header';
import { ExamInput } from './components/ExamInput';
import { CameraScanner } from './components/CameraScanner';
import { ResultsView } from './components/ResultsView';
import { HistoryView } from './components/HistoryView';
import { Edit3, Camera, History, ShieldAlert } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'scanner' | 'history'>('input');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [history, setHistory] = useState<SavedExam[]>([]);

  // Estado do exame ativo em análise
  const [activeInputs, setActiveInputs] = useState<BloodGasInputs | null>(null);
  const [activePatientName, setActivePatientName] = useState<string>('Paciente Anônimo');
  const [activeResult, setActiveResult] = useState<InterpretationResult | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  // Id do exame de histórico atualmente em exibição (null se for um exame novo, ainda não salvo)
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  // Carrega chaves e histórico ao iniciar o app
  useEffect(() => {
    const savedKey = localStorage.getItem('gasometria_gemini_key') || '';
    setGeminiKey(savedKey);

    const savedHistoryStr = localStorage.getItem('gasometria_history');
    if (savedHistoryStr) {
      try {
        setHistory(JSON.parse(savedHistoryStr));
      } catch (e) {
        console.error("Erro ao carregar histórico", e);
      }
    }
  }, []);

  // Lida com o envio de formulário manual
  const handleInputSubmit = (inputs: BloodGasInputs, patientName: string) => {
    const result = interpretBloodGas(inputs);
    setActiveInputs(inputs);
    setActivePatientName(patientName);
    setActiveResult(result);
    setIsSaved(false);
    setActiveExamId(null);
  };

  // Lida com o sucesso do escaneamento por OCR/AI.
  // SEGURANÇA CLÍNICA: os valores extraídos NÃO vão direto para a interpretação.
  // Eles pré-preenchem o formulário editável para que o médico confira/corrija
  // cada parâmetro antes de gerar o diagnóstico (OCR/IA pode errar a leitura).
  const handleScanSuccess = (inputs: BloodGasInputs) => {
    setActiveInputs(inputs);
    setActivePatientName("Paciente Escaneado");
    setActiveResult(null);
    setIsSaved(false);
    setActiveExamId(null);
    setActiveTab('input');
  };

  // Salva exame ativo no histórico do localStorage
  const handleSaveExam = () => {
    if (!activeInputs || !activeResult) return;

    const newSavedExam: SavedExam = {
      id: Date.now().toString(),
      patientName: activePatientName,
      date: new Date().toISOString(),
      inputs: activeInputs,
      result: activeResult
    };

    const updatedHistory = [newSavedExam, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('gasometria_history', JSON.stringify(updatedHistory));
    setIsSaved(true);
    setActiveExamId(newSavedExam.id);
  };

  // Carrega exame antigo do histórico para exibição
  const handleSelectHistoryExam = (exam: SavedExam) => {
    setActiveInputs(exam.inputs);
    setActivePatientName(exam.patientName);
    setActiveResult(exam.result);
    setIsSaved(true); // Já estava salvo
    setActiveExamId(exam.id);
  };

  // Deleta exame do histórico
  const handleDeleteHistoryExam = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('gasometria_history', JSON.stringify(updatedHistory));

    // Só limpa a exibição se o exame deletado for EXATAMENTE o que está sendo exibido
    if (activeExamId === id) {
      setActiveResult(null);
      setActiveInputs(null);
      setActiveExamId(null);
    }
  };

  // Limpa todo o histórico
  const handleClearAllHistory = () => {
    if (window.confirm("Deseja realmente limpar todo o histórico de exames?")) {
      setHistory([]);
      localStorage.removeItem('gasometria_history');
      setActiveResult(null);
      setActiveInputs(null);
      setActiveExamId(null);
    }
  };

  // Volta do modo resultados para o modo formulário
  const handleBackToInputs = () => {
    setActiveResult(null);
    // Mantemos activeInputs para que o formulário continue preenchido com os valores inseridos
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header geminiKey={geminiKey} setGeminiKey={setGeminiKey} />

      {/* Main Content Area */}
      <main className="main-content">
        {activeResult && activeInputs ? (
          // Exibição de Resultados
          <ResultsView 
            inputs={activeInputs}
            result={activeResult}
            patientName={activePatientName}
            onBack={handleBackToInputs}
            onSave={handleSaveExam}
            isSaved={isSaved}
          />
        ) : (
          // Exibição da Tab ativa
          <>
            {activeTab === 'input' && (
              <ExamInput 
                onSubmit={handleInputSubmit}
                initialInputs={activeInputs}
              />
            )}

            {activeTab === 'scanner' && (
              <CameraScanner 
                geminiKey={geminiKey}
                onScanSuccess={handleScanSuccess}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView 
                history={history}
                onSelect={handleSelectHistoryExam}
                onDelete={handleDeleteHistoryExam}
                onClearAll={handleClearAllHistory}
              />
            )}
          </>
        )}

        {/* Aviso permanente nas telas de entrada/scanner/histórico
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

      {/* Bottom Tab Navigation Bar */}
      {!activeResult && (
        <nav className="bottom-nav">
          <button 
            onClick={() => setActiveTab('input')} 
            className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
          >
            <Edit3 />
            <span>Calculadora</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('scanner')} 
            className={`nav-item ${activeTab === 'scanner' ? 'active' : ''}`}
          >
            <Camera />
            <span>Escanear</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')} 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          >
            <History />
            <span>Histórico</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
