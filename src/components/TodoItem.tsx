import type { Todo } from '../types/todo';

interface Props {
  todo: Todo;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: () => void;
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

export default function TodoItem({ todo, isCompleted, onToggle, onEdit }: Props) {
  const timeLabel = formatTime(todo.time);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        minHeight: 67, padding: '12px 0',
      }}
    >
      {/* 텍스트 영역 클릭 → 수정 페이지 */}
      <button
        onClick={onEdit}
        style={{
          flex: 1, minWidth: 0, textAlign: 'left',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        }}
      >
        <p style={{
          fontSize: 17, fontWeight: 600,
          color: 'rgba(0, 12, 30, 1)',
          margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {todo.title}
        </p>
        {timeLabel && (
          <p style={{
            fontSize: 15, fontWeight: 400,
            color: isCompleted ? 'rgba(0, 19, 43, 1)' : '#2272eb',
            margin: '4px 0 0',
          }}>
            {timeLabel}
          </p>
        )}
      </button>

      {/* 체크박스 - TDS Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 24, height: 24,
          border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, padding: 0,
        }}
        aria-label="완료 토글"
      >
        {isCompleted ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#3182F6"/>
            <path d="M7 12.5L10.5 16L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="rgba(0,29,58,0.2)" strokeWidth="1.5" fill="none"/>
            <path d="M8 12.5L11 15.5L16 9" stroke="rgba(0,29,58,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
