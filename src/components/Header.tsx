import React, { useState } from 'react';
import { Settings, Key, Info, Check, Trash2, X } from 'lucide-react';
import logo from '../assets/logo.png';

interface HeaderProps {
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ geminiKey, setGeminiKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(geminiKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setGeminiKey(tempKey.trim());
    localStorage.setItem('gasometria_gemini_key', tempKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsOpen(false);
    }, 1000);
  };

  const handleClear = () => {
    setTempKey('');
    setGeminiKey('');
    localStorage.removeItem('gasometria_gemini_key');
  };

  return (
    <>
      <header className="glass-card" style={{
        margin: '16px 20px 0 20px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: '4px solid var(--primary)',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={logo}
            alt="GasoMaster — Gasometria Arterial"
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              objectFit: 'cover',
              display: 'block',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}
          />
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.2 }}>GasoMaster</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Interpretação Ácido-Base Premium</p>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '8px',
            borderRadius: '50%',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <Settings size={20} />
        </button>
      </header>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div 
            className="glass-card" 
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} className="text-secondary" color="var(--primary)" />
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Configurações da IA</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Insira sua chave de API do Gemini para habilitar a digitalização de fotos de exames usando visão computacional de alta precisão.
            </p>

            <div style={{ position: 'relative' }}>
              <input 
                type="password"
                className="text-input"
                placeholder="Insira sua Gemini API Key..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                style={{ paddingRight: '40px' }}
              />
              <Key size={16} style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
            </div>

            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Sua chave de API é armazenada localmente apenas no seu navegador (`localStorage`) e nunca é enviada para nenhum servidor externo além da API oficial do Google Gemini.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {geminiKey && (
                <button 
                  onClick={handleClear}
                  className="btn-secondary"
                  style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={16} color="var(--color-arterial)" />
                </button>
              )}
              <button 
                onClick={handleSave}
                className="btn-primary"
                style={{ flex: 1, height: '45px' }}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <Check size={16} /> Salvo!
                  </>
                ) : (
                  "Salvar Chave"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
