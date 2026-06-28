import type { SavedExam } from '../types';
import { Trash2, Calendar, FileText, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
  history: SavedExam[];
  onSelect: (exam: SavedExam) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelect,
  onDelete,
  onClearAll
}) => {
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getDisorderBorderClass = (disorder: string) => {
    if (disorder.includes('Normal')) return 'active-normal';
    if (disorder.includes('Acidose') || disorder.includes('Acidemia')) return 'active-arterial';
    if (disorder.includes('Alcalose') || disorder.includes('Alcalemia')) return 'active-alkalosis';
    return 'active-warning';
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Histórico de Exames</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exames interpretados salvos localmente</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={onClearAll} 
            className="btn-secondary" 
            style={{ 
              padding: '6px 12px', 
              fontSize: '12px', 
              color: 'var(--color-arterial)', 
              borderColor: 'rgba(244, 63, 94, 0.2)' 
            }}
          >
            Limpar Tudo
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '16px',
            borderRadius: '50%',
            color: 'var(--text-muted)'
          }}>
            <FileText size={32} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Nenhum exame salvo</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '280px', lineHeight: 1.4 }}>
              As gasometrias que você salvar aparecerão aqui. Suas informações ficam armazenadas de forma segura e privada no seu dispositivo.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((exam) => (
            <div 
              key={exam.id}
              className={`glass-card ${getDisorderBorderClass(exam.result.primaryDisorder)}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                cursor: 'pointer'
              }}
              onClick={() => onSelect(exam)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0, paddingRight: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '160px'
                  }}>
                    {exam.patientName}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: exam.inputs.type === 'arterial' ? 'var(--color-arterial-glow)' : 'var(--color-venous-glow)',
                    color: exam.inputs.type === 'arterial' ? 'var(--color-arterial)' : 'var(--color-venous)'
                  }}>
                    {exam.inputs.type === 'arterial' ? 'Art' : 'Ven'}
                  </span>
                </div>
                
                <h4 style={{ 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {exam.result.primaryDisorder}
                </h4>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={10} /> {formatDate(exam.date)}
                  </span>
                  <span>
                    pH: <strong>{exam.inputs.pH.toFixed(2)}</strong> | pCO₂: <strong>{exam.inputs.pCO2}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onDelete(exam.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                    e.currentTarget.style.color = 'var(--color-arterial)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  <Trash2 size={16} />
                </button>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
