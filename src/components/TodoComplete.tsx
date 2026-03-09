import { useState, useEffect } from 'react';
import type { Recurrence } from '../types/todo';

export interface CompletedTodoInfo {
  title: string;
  recurrence: Recurrence;
  date: string;
  time?: string;
}

interface Props {
  todo: CompletedTodoInfo;
  onHome: () => void;
  onAddMore: () => void;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h % 12 || 12;
  return `${ampm} ${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function TodoComplete({ todo, onHome, onAddMore }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const tags = [
    { text: todo.recurrence, accent: true },
    { text: formatDate(todo.date), accent: false },
    ...(todo.time ? [{ text: formatTime(todo.time), accent: false }] : []),
  ];

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: '0 24px',
        overflowY: 'auto',
      }}
    >
      {/* Checkmark circle */}
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4196F8 0%, #3182F6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(49, 130, 246, 0.35)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          transition: 'opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M7 17L13.5 23.5L27 10"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#1a1a1a',
          margin: '0 0 8px',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s 0.15s ease-out, transform 0.3s 0.15s ease-out',
        }}
      >
        할 일을 추가했어요!
      </h1>
      <p
        style={{
          fontSize: 14,
          color: '#8b95a1',
          margin: '0 0 36px',
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s 0.2s ease-out, transform 0.3s 0.2s ease-out',
        }}
      >
        꾸준히 하면 습관이 될 거예요 💪
      </p>

      {/* Summary card */}
      <div
        style={{
          width: '100%',
          background: '#F9FAFB',
          borderRadius: 20,
          padding: '20px 20px',
          marginBottom: 32,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.3s 0.25s ease-out, transform 0.3s 0.25s ease-out',
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#3182F6',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>{todo.title}</span>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                padding: '5px 12px',
                background: tag.accent ? '#EEF4FF' : '#ECEEF0',
                color: tag.accent ? '#3182F6' : '#4e5968',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {tag.text}
            </span>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s 0.32s ease-out, transform 0.3s 0.32s ease-out',
        }}
      >
        <button
          onClick={onAddMore}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: '1.5px solid #E5E8EB',
            background: '#fff',
            color: '#4e5968',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          하나 더 추가하기
        </button>
        <button
          onClick={onHome}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 14,
            border: 'none',
            background: '#3182F6',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          홈으로 가기
        </button>
      </div>
    </div>
  );
}
