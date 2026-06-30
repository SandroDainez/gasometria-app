import logo from '../assets/logo.png';

export const Header = () => {
  return (
    <header className="glass-card" style={{
      margin: '16px 20px 0 20px',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderLeft: '4px solid var(--primary)',
      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)'
    }}>
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
    </header>
  );
};
