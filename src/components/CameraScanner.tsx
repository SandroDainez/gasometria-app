import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { parseOcrText } from '../utils/ocrParser';
import type { BloodGasInputs } from '../types';
import { Camera, Upload, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface CameraScannerProps {
  geminiKey: string;
  onScanSuccess: (inputs: BloodGasInputs) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ geminiKey, onScanSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detectedValues, setDetectedValues] = useState<Partial<BloodGasInputs> | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Converte arquivo em Base64 para a API do Gemini
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove o cabeçalho data:image/jpeg;base64,
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processImage = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setDetectedValues(null);

    try {
      if (geminiKey) {
        // --- MÉTODO 1: API DO GEMINI (VISÃO COMPUTACIONAL AVANÇADA) ---
        setProgress('Convertendo imagem...');
        const base64Image = await fileToBase64(file);
        
        setProgress('Interpretando com Gemini Vision...');
        const prompt = `Você é um extrator de dados médicos estruturados especializado em exames de gasometria arterial e venosa. Sua tarefa é analisar a imagem do exame fornecida e extrair os valores numéricos exatos de cada parâmetro. Retorne APENAS um objeto JSON válido, sem formatação markdown (sem \`\`\`json), com os seguintes campos (use null se o parâmetro não estiver visível ou não existir no exame):\n{\n  "type": "arterial" ou "venous" (tente identificar a origem pelo contexto, ex: se pO2 < 50 e SatO2 < 80, ou se constar "venosa", marque "venous"; caso contrário, padrão é "arterial"),\n  "pH": número decimal (ex: 7.42),\n  "pCO2": número inteiro/decimal (ex: 40),\n  "pO2": número inteiro/decimal (ex: 90),\n  "HCO3": número decimal (ex: 24.5),\n  "BE": número decimal (ex: -1.2),\n  "SatO2": número inteiro/decimal (ex: 98),\n  "Na": número inteiro/decimal ou null,\n  "Cl": número inteiro/decimal ou null,\n  "K": número inteiro/decimal ou null,\n  "Albumin": número decimal ou null,\n  "FiO2": número inteiro/decimal ou null\n}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: file.type || 'image/jpeg',
                        data: base64Image
                      }
                    }
                  ]
                }
              ]
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Erro na API do Gemini: ${response.statusText}`);
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Faz o parse do JSON retornado pelo Gemini
        const cleanJsonText = textResponse.trim().replace(/^```json\s*|```$/g, '');
        const parsed = JSON.parse(cleanJsonText);
        
        // Remove chaves nulas
        const cleanResult: Partial<BloodGasInputs> = {};
        Object.keys(parsed).forEach(key => {
          if (parsed[key] !== null) {
            cleanResult[key as keyof BloodGasInputs] = parsed[key];
          }
        });

        // Valores mínimos obrigatórios para interpretação
        if (cleanResult.pH !== undefined && cleanResult.pCO2 !== undefined && cleanResult.HCO3 !== undefined) {
          // Garante fallback de outros obrigatórios
          cleanResult.pO2 = cleanResult.pO2 ?? (cleanResult.type === 'venous' ? 35 : 90);
          cleanResult.BE = cleanResult.BE ?? 0;
          cleanResult.SatO2 = cleanResult.SatO2 ?? (cleanResult.type === 'venous' ? 70 : 98);
          setDetectedValues(cleanResult);
        } else {
          throw new Error("O Gemini não conseguiu localizar os parâmetros básicos (pH, pCO₂ ou HCO₃⁻) na imagem. Tente tirar uma foto mais nítida.");
        }

      } else {
        // --- MÉTODO 2: TESSERACT.JS (OCR LOCAL FALLBACK) ---
        setProgress('Carregando OCR local...');
        
        const { data: { text } } = await Tesseract.recognize(file, 'por', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(`Reconhecendo texto: ${Math.round(m.progress * 100)}%`);
            }
          }
        });

        setProgress('Analisando texto...');
        const parsed = parseOcrText(text);

        if (parsed.pH !== undefined && parsed.pCO2 !== undefined && parsed.HCO3 !== undefined) {
          // Garante fallback de outros obrigatórios
          parsed.pO2 = parsed.pO2 ?? (parsed.type === 'venous' ? 35 : 90);
          parsed.BE = parsed.BE ?? 0;
          parsed.SatO2 = parsed.SatO2 ?? (parsed.type === 'venous' ? 70 : 98);
          setDetectedValues(parsed);
        } else {
          console.log("Texto detectado:", text);
          throw new Error("Não foi possível detectar parâmetros básicos do exame. Certifique-se de que a imagem é nítida, está bem iluminada e sem sombras, ou configure a Chave de API do Gemini nas configurações para leitura com inteligência artificial.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao processar a imagem do exame.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    if (detectedValues) {
      onScanSuccess(detectedValues as BloodGasInputs);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Digitalizar Exame</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.4 }}>
          Tire uma foto nítida do laudo da gasometria ou faça o upload de uma imagem da sua galeria.
        </p>

        {/* Inputs ocultos de arquivos */}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange}
        />

        {/* Área de Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            type="button" 
            className="btn-primary" 
            style={{ width: '100%', padding: '16px' }}
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
          >
            <Camera size={20} /> Tirar Foto do Exame
          </button>
          
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ width: '100%', padding: '14px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <Upload size={18} /> Upload da Galeria
          </button>
        </div>

        {/* Informação sobre Gemini Key */}
        {!geminiKey && (
          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginTop: '20px',
            textAlign: 'left',
            alignItems: 'flex-start'
          }}>
            <AlertCircle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Dica Premium:</strong> Você está usando OCR local. Para uma precisão absurdamente superior em qualquer tipo de laudo ou foto com sombras, configure uma **Chave de API do Gemini** clicando no ícone de engrenagem no topo.
            </span>
          </div>
        )}
      </div>

      {/* Exibição do Loader / Progresso */}
      {loading && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(99, 102, 241, 0.1)',
            borderTop: '4px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{progress}</span>
        </div>
      )}

      {/* Exibição de Erros */}
      {error && !loading && (
        <div className="glass-card active-arterial" style={{ padding: '18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertCircle size={20} color="var(--color-arterial)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-arterial)', marginBottom: '4px' }}>Erro na leitura</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{error}</p>
          </div>
        </div>
      )}

      {/* Exibição de Sucesso e Confirmação dos dados extraídos */}
      {detectedValues && !loading && (
        <div className="glass-card active-normal" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <CheckCircle size={20} color="var(--color-normal)" />
            <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Leitura Concluída com Sucesso!</h4>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Estes são os parâmetros lidos pela leitura automática. A leitura por OCR/IA pode conter erros —
            ao continuar, você poderá <strong>conferir e corrigir cada valor</strong> no formulário antes de gerar a interpretação:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tipo:</span>
              <strong style={{ color: detectedValues.type === 'arterial' ? 'var(--color-arterial)' : 'var(--color-venous)' }}>
                {detectedValues.type === 'arterial' ? 'Arterial' : 'Venoso'}
              </strong>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>pH:</span>
              <strong>{detectedValues.pH?.toFixed(2)}</strong>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>pCO₂:</span>
              <strong>{detectedValues.pCO2} mmHg</strong>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>HCO₃⁻:</span>
              <strong>{detectedValues.HCO3?.toFixed(1)} mEq/L</strong>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>pO₂:</span>
              <strong>{detectedValues.pO2} mmHg</strong>
            </div>
            <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>SatO₂:</span>
              <strong>{detectedValues.SatO2}%</strong>
            </div>
            {detectedValues.Na !== undefined && (
              <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Na⁺:</span>
                <strong>{detectedValues.Na} mEq/L</strong>
              </div>
            )}
            {detectedValues.Cl !== undefined && (
              <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cl⁻:</span>
                <strong>{detectedValues.Cl} mEq/L</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setDetectedValues(null)}
              className="btn-secondary" 
              style={{ flex: 1, padding: '12px' }}
            >
              <RefreshCw size={16} /> Refazer
            </button>
            <button 
              onClick={handleConfirm}
              className="btn-primary"
              style={{ flex: 1, padding: '12px' }}
            >
              Revisar e Corrigir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
