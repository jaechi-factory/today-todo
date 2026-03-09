import { useState } from 'react';
import type { Todo } from '../types/todo';

interface Props {
  todo: Todo;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
}

function formatTime(time?: string): string | null {
  if (!time) return null;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h < 12 ? '오전' : '오후';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m > 0 ? `${ampm} ${hour}시 ${m}분` : `${ampm} ${hour}시`;
}

export default function TodoItem({ todo, isCompleted, onToggle, onDelete }: Props) {
  const [pressing, setPressing] = useState(false);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  function handlePressStart() {
    const timer = setTimeout(() => setShowDelete(true), 600);
    setPressTimer(timer);
    setPressing(true);
  }
  function handlePressEnd() {
    if (pressTimer) clearTimeout(pressTimer);
    setPressing(false);
  }
  function handleDelete() {
    setShowDelete(false);
    onDelete(todo.id);
  }

  const timeLabel = formatTime(todo.time);

  return (
    <>
      {showDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowDelete(false)}
        >
          <div
            style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#1a1a1a' }}>할 일을 삭제할까요?</p>
            <p style={{ fontSize: 14, color: '#8b95a1', marginBottom: 24 }}>"{todo.title}"</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowDelete(false)}
                style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#F2F4F6', fontSize: 15, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }}>취소</button>
              <button onClick={handleDelete}
                style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#f04452', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex', alignItems: 'center',
          minHeight: 67, padding: '12px 0',
          opacity: pressing ? 0.7 : 1, transition: 'opacity 0.1s',
          /* 아이템 간 구분선 없음 - Figma 스펙 */
        }}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      >
        {/* 텍스트 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 17, fontWeight: 600,
            color: 'rgba(0, 12, 30, 0.80)',   /* #000c1e@0.80 */
            margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {todo.title}
          </p>
          {timeLabel && (
            <p style={{
              fontSize: 15, fontWeight: 400,
              /* active: #2272eb, done: #00132b@0.58 */
              color: isCompleted ? 'rgba(0, 19, 43, 0.58)' : '#2272eb',
              margin: '4px 0 0',
            }}>
              {timeLabel}
            </p>
          )}
        </div>

        {/* 체크박스 */}
        <button
          onClick={onToggle}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            border: isCompleted ? 'none' : '1px solid rgba(0, 29, 58, 0.18)',
            background: isCompleted ? '#3182f6' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
            padding: 0,
          }}
          aria-label="완료 토글"
        >
          {isCompleted ? (
            /* 완료: 흰색 체크 */
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M2 5.5L5.5 9L12 2" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            /* 미완료: 연한 체크 아웃라인 */
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1.5 4.5L4.5 7.5L9.5 1.5" stroke="rgba(0,29,58,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </>
  );
}
