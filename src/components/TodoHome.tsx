import { useState, useMemo } from 'react';
import TodoItem from './TodoItem';
import type { Todo } from '../types/todo';
import { isTodoOnDate, isCompletedOnDate } from '../hooks/useTodos';

interface Props {
  todos: Todo[];
  onToggle: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  onCreateTap: () => void;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}요일`;
}

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDow(y: number, m: number) { return new Date(y, m, 1).getDay(); }

// ─── 캘린더 바텀시트 ─────────────────────────────────────────────
function CalendarSheet({ selectedDate, onConfirm, onClose }: {
  selectedDate: string; onConfirm: (d: string) => void; onClose: () => void;
}) {
  const todayStr = toDateString(new Date());
  const init = new Date(selectedDate + 'T00:00:00');
  const [vy, setVy] = useState(init.getFullYear());
  const [vm, setVm] = useState(init.getMonth());
  const [temp, setTemp] = useState(selectedDate);

  const daysInMonth = getDaysInMonth(vy, vm);
  const firstDow = getFirstDow(vy, vm);
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function cellStr(day: number) {
    return `${vy}-${String(vm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function prevMonth() { vm === 0 ? (setVy(y => y - 1), setVm(11)) : setVm(m => m - 1); }
  function nextMonth() { vm === 11 ? (setVy(y => y + 1), setVm(0)) : setVm(m => m + 1); }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e8eb' }} />
        </div>
        <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#1a1a1a', margin: '8px 0 16px' }}>어떤 날의 일정을 볼까요?</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="#4e5968" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{vy}년 {vm + 1}월</span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 5L12.5 10L7.5 15" stroke="#4e5968" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px', marginBottom: 4 }}>
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: i === 0 ? '#f04452' : i === 6 ? '#3182f6' : '#8b95a1', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px', marginBottom: 8 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ aspectRatio: '1' }} />;
            const ds = cellStr(day);
            const isSel = ds === temp;
            const isTdy = ds === todayStr;
            const col = idx % 7;
            return (
              <button key={ds} onClick={() => setTemp(ds)} style={{
                width: '100%', aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel ? '#3182f6' : 'none', borderRadius: '50%',
                border: isTdy && !isSel ? '1.5px solid #3182f6' : 'none',
                cursor: 'pointer', fontSize: 14, fontWeight: isSel || isTdy ? 700 : 400,
                color: isSel ? '#fff' : col === 0 ? '#f04452' : col === 6 ? '#3182f6' : '#1a1a1a',
              }}>{day}</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '8px 20px 34px' }}>
          <button onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#F2F4F6', fontSize: 16, fontWeight: 700, color: '#1a1a1a', cursor: 'pointer' }}>닫기</button>
          <button onClick={() => onConfirm(temp)} style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#3182f6', fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>선택완료</button>
        </div>
      </div>
    </div>
  );
}


// ─── 메인 ────────────────────────────────────────────────────────
export default function TodoHome({ todos, onToggle, onDelete, onCreateTap }: Props) {
  const todayStr = toDateString(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showCalendar, setShowCalendar] = useState(false);

  const activeTodos = useMemo(
    () => todos
      .filter(t => isTodoOnDate(t, selectedDate) && !isCompletedOnDate(t, selectedDate))
      .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.createdAt.localeCompare(b.createdAt)),
    [todos, selectedDate]
  );

  const completedTodos = useMemo(
    () => todos
      .filter(t => isTodoOnDate(t, selectedDate) && isCompletedOnDate(t, selectedDate))
      .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.createdAt.localeCompare(b.createdAt)),
    [todos, selectedDate]
  );

  const total = activeTodos.length + completedTodos.length;

  // ── 빈 상태 ──────────────────────────────────────────────────
  if (todos.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '60px 24px 28px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#191f28', margin: 0, lineHeight: 1.3 }}>
            해야할 일을 놓치지 않게<br />가볍게 기록해 보세요
          </h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <img src="/assets/sun.png" alt="sun" style={{ width: 120, height: 120 }} />
          <p style={{ fontSize: 15, color: '#8b95a1', margin: 0, fontWeight: 500 }}>아직 등록된 할일이 없어요</p>
        </div>
        {/* CTA - 그라데이션 포함 */}
        <div>
          <div style={{ height: 36, background: 'linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)', pointerEvents: 'none' }} />
          <div style={{ background: '#ffffff', padding: '0 20px 20px' }}>
            <button
              onClick={onCreateTap}
              style={{ width: '100%', height: 56, borderRadius: 14, border: 'none', background: '#3182F6', color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer' }}
            >할 일 추가하기</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 일반 상태 ────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fff' }}>

      {showCalendar && (
        <CalendarSheet
          selectedDate={selectedDate}
          onConfirm={(ds) => { setSelectedDate(ds); setShowCalendar(false); }}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* 헤더 영역 - 보더 없음 */}
      <div style={{ background: '#fff', flexShrink: 0 }}>
        {/* 타이틀 */}
        <div style={{ padding: '56px 24px 0' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#191f28', margin: 0 }}>오늘 할 일</h1>
        </div>

        {/* 날짜 행 (Listheader V3) */}
        <div style={{ padding: '16px 24px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setShowCalendar(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <span style={{ fontSize: 17, fontWeight: 700, color: 'rgba(0,12,30,0.80)' }}>{formatDateLabel(selectedDate)}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="rgba(0,12,30,0.80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(3,18,40,0.70)' }}>총 {total}개</span>
        </div>

        {/* 스텝 프로그레스 */}
        {total > 0 && (
          <div style={{ padding: '8px 24px 12px', position: 'relative' }}>
            {/* 트랙 */}
            <div style={{ position: 'relative', height: 4, borderRadius: 2, background: '#e5e8eb' }}>
              {/* 채워진 바 */}
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${(completedTodos.length / total) * 100}%`,
                background: '#3182f6', borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
              {/* 스텝 점 */}
              {Array.from({ length: total }, (_, i) => {
                const pos = ((i + 1) / total) * 100;
                const isDone = i < completedTodos.length;
                return (
                  <div key={i} style={{
                    position: 'absolute',
                    left: `${pos}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: isDone ? '#3182f6' : '#e5e8eb',
                    border: isDone ? 'none' : '1.5px solid #c5ccd5',
                    boxSizing: 'border-box',
                  }} />
                );
              })}
            </div>
            {/* 숫자 레이블 */}
            <div style={{ position: 'relative', marginTop: 6, height: 16 }}>
              {Array.from({ length: total }, (_, i) => {
                const pos = ((i + 1) / total) * 100;
                const isDone = i < completedTodos.length;
                return (
                  <span key={i} style={{
                    position: 'absolute',
                    left: `${pos}%`,
                    transform: 'translateX(-50%)',
                    fontSize: 11, fontWeight: isDone ? 600 : 400,
                    color: isDone ? '#3182f6' : '#8b95a1',
                  }}>{i + 1}</span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 116, background: '#fff' }}>

        {/* 할 일 목록 - 보더 없이 좌우 24px 패딩 */}
        {activeTodos.length > 0 && (
          <div style={{ padding: '0 24px' }}>
            {activeTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isCompleted={false}
                onToggle={() => onToggle(todo.id, selectedDate)}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* 모두 완료 메시지 */}
        {activeTodos.length === 0 && completedTodos.length > 0 && (
          <div style={{ padding: '40px 24px 0', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#b0b8c1', fontWeight: 500, margin: 0 }}>모든 할 일을 완료했어요 🎉</p>
          </div>
        )}

        {/* 구분선: 16px white + 12px gray + 16px white */}
        {completedTodos.length > 0 && (
          <>
            <div style={{ height: 16, background: '#ffffff' }} />
            <div style={{ height: 12, background: '#e5e8eb' }} />
            <div style={{ height: 16, background: '#ffffff' }} />
          </>
        )}

        {/* 해낸 일 섹션 - 항상 펼침, 꺽쇠 없음 */}
        {completedTodos.length > 0 && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 24px 4px',
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(0,12,30,0.80)' }}>해낸 일</span>
              <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(3,18,40,0.70)' }}>{completedTodos.length}개</span>
            </div>
            <div style={{ padding: '0 24px' }}>
              {completedTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isCompleted={true}
                  onToggle={() => onToggle(todo.id, selectedDate)}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 고정 CTA - 그라데이션 + 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        {/* 상단 그라데이션 (36px) */}
        <div style={{
          height: 36,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)',
          pointerEvents: 'none',
        }} />
        {/* 버튼 컨테이너 */}
        <div style={{ background: '#ffffff', padding: '0 20px 20px' }}>
          <button
            onClick={onCreateTap}
            style={{
              width: '100%', height: 56,
              borderRadius: 14, border: 'none',
              background: '#3182F6', color: '#fff',
              fontSize: 17, fontWeight: 600, cursor: 'pointer',
            }}
          >할 일 추가하기</button>
        </div>
      </div>
    </div>
  );
}
