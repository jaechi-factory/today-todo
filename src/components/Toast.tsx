import { useEffect } from 'react';

interface Props {
  message: string;
  type?: 'default' | 'success';
  onDone: () => void;
}

export default function Toast({ message, type = 'default', onDone }: Props) {
  useEffect(() => {
    const duration = type === 'success' ? 2500 : 2000;
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, type]);

  if (type === 'success') {
    return (
      <div style={{
        position: 'fixed',
        top: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#fff',
        border: '1px solid #E5E8EB',
        color: '#1a1a1a',
        padding: '10px 16px',
        borderRadius: 100,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        zIndex: 300,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: 'fadeInDown 0.25s ease',
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {message}
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 100,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(26, 26, 26, 0.9)',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 100,
      fontSize: 14,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      zIndex: 200,
      backdropFilter: 'blur(8px)',
      animation: 'fadeInUp 0.2s ease',
    }}>
      {message}
    </div>
  );
}
