import { useState, useRef, useEffect } from 'react';
import type { Todo, Recurrence } from '../types/todo';

interface Props {
  todo: Todo;
  onUpdate: (updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'isCompleted' | 'completedAt' | 'completedDates'>>) => void;
  onDelete: () => void;
  onBack: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const DOW_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

const ITEM_H_DOM = 52;
const DOM_VISIBLE = 6.5;

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${parseInt(m)}월 ${parseInt(d)}일`;
}

function formatDaysOfWeek(days: number[]): string {
  if (days.length === 0) return '';
  const names = ['일', '월', '화', '수', '목', '금', '토'];
  return DOW_ORDER.filter(d => days.includes(d)).map(d => names[d]).join(', ') + '요일';
}

function formatDaysOfMonth(days: number[]): string {
  if (days.length === 0) return '';
  const sorted = [...days].sort((a, b) => {
    if (a === 0) return 1;
    if (b === 0) return -1;
    return a - b;
  });
  return '매월 ' + sorted.map(d => (d === 0 ? '말일' : `${d}일`)).join(', ');
}

/** HH:mm (24hr) → { ampm, hour, minute } */
function parseTime(time: string): { ampm: string; hour: string; minute: string } {
  const [hStr, m] = time.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? '오후' : '오전';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { ampm, hour: String(h).padStart(2, '0'), minute: m };
}

function buildTimeStr(ap: string, h: string, m: string): string {
  let h24 = parseInt(h, 10);
  if (ap === '오후' && h24 !== 12) h24 += 12;
  if (ap === '오전' && h24 === 12) h24 = 0;
  return `${String(h24).padStart(2, '0')}:${m}`;
}

// ────────── Calendar Picker ──────────
function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const init = value ? new Date(value + 'T00:00:00') : new Date();
  const [view, setView] = useState({ year: init.getFullYear(), month: init.getMonth() });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = value ? new Date(value + 'T00:00:00') : null;

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = new Date(view.year, view.month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function toISO(day: number) {
    return `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px', marginBottom: 8 }}>
        <button
          onClick={() => { const d = new Date(view.year, view.month - 1, 1); setView({ year: d.getFullYear(), month: d.getMonth() }); }}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4e5968', padding: '4px 12px' }}
        >‹</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{view.year}년 {view.month + 1}월</span>
        <button
          onClick={() => { const d = new Date(view.year, view.month + 1, 1); setView({ year: d.getFullYear(), month: d.getMonth() }); }}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#4e5968', padding: '4px 12px' }}
        >›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: 6 }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? '#f04452' : i === 6 ? '#3182f6' : '#8b95a1', padding: '4px 0' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} style={{ aspectRatio: '1' }} />;
          const d = new Date(view.year, view.month, day);
          d.setHours(0, 0, 0, 0);
          const isSel = selected && d.getTime() === selected.getTime();
          const isToday = d.getTime() === today.getTime();
          const isPast = d < today;
          const dow = d.getDay();
          return (
            <button
              key={day}
              onClick={() => !isPast && onChange(toISO(day))}
              style={{
                aspectRatio: '1', borderRadius: '50%', border: 'none',
                background: isSel ? '#3182f6' : isToday && !isSel ? '#EEF4FF' : 'transparent',
                color: isSel ? '#fff' : isPast ? '#d1d6db' : dow === 0 ? '#f04452' : dow === 6 ? '#3182f6' : '#1a1a1a',
                fontSize: 14, fontWeight: isToday ? 700 : 400,
                cursor: isPast ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
              }}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

// ────────── Scroll Column ──────────
const ITEM_H = 44;

function ScrollColumn({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = items.indexOf(value);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onChange(items[clamped]);
    }, 80);
  }

  return (
    <div style={{ position: 'relative', flex: 1, height: ITEM_H * 5, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: ITEM_H * 2, left: 4, right: 4, height: ITEM_H, background: '#F2F4F6', borderRadius: 10, zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2, background: 'linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0) 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2, background: 'linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0) 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div
        ref={ref}
        className="scroll-hide"
        onScroll={onScroll}
        style={{ height: '100%', overflowY: 'scroll', paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2, position: 'relative', zIndex: 1 }}
      >
        {items.map(item => (
          <div key={item} style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: item === value ? 600 : 400, color: item === value ? '#1a1a1a' : '#b0b8c1' }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────── Underline Field ──────────
function UnderlineField({
  label, value, placeholder, onClick, showArrow = true,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onClick?: () => void;
  showArrow?: boolean;
}) {
  const hasValue = Boolean(value);
  const isEditable = Boolean(onClick);
  const textColor = hasValue ? 'rgba(0,12,30,0.80)' : 'rgba(0,12,30,0.30)';

  return (
    <div>
      <button
        onClick={onClick}
        disabled={!onClick}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: isEditable ? 'pointer' : 'default' }}
      >
        <div style={{ borderBottom: '1.5px solid rgba(0,12,30,0.15)', paddingBottom: 10 }}>
          <p style={{ fontSize: 13, color: 'rgba(0,12,30,0.80)', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: textColor }}>
              {value || placeholder}
            </span>
            {showArrow && isEditable && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="rgba(0,12,30,0.30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

// ────────── CheckRow ──────────
function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'none', border: 'none', padding: '0 24px',
        height: ITEM_H_DOM, cursor: 'pointer', flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 16, color: '#1a1a1a' }}>{label}</span>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: checked ? '#3182F6' : 'transparent',
        border: checked ? 'none' : '2px solid #D1D6DB',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}

// ────────── Bottom Sheet ──────────
function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 36, height: 4, background: '#E5E8EB', borderRadius: 2, margin: '10px auto 0' }} />
        {children}
      </div>
    </div>
  );
}

// ────────── Sheet Actions ──────────
function SheetActions({ onClose, onConfirm, confirmLabel = '선택완료', canConfirm = true }: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  canConfirm?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '12px 20px 34px', flexShrink: 0 }}>
      <button
        onClick={onClose}
        style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#F2F4F6', color: '#4e5968', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
      >닫기</button>
      <button
        onClick={onConfirm}
        disabled={!canConfirm}
        style={{
          flex: 2, height: 52, borderRadius: 12, border: 'none',
          background: canConfirm ? '#3182F6' : '#E5E8EB',
          color: canConfirm ? '#fff' : '#b0b8c1',
          fontSize: 16, fontWeight: 700, cursor: canConfirm ? 'pointer' : 'default',
        }}
      >{confirmLabel}</button>
    </div>
  );
}

// ────────── Main Component ──────────
export default function TodoEdit({ todo, onUpdate, onDelete, onBack }: Props) {
  const initRecurrence: Recurrence = todo.recurrence ?? '1회';
  const initDate = initRecurrence === '1회' ? todo.startDate : todayISO();
  const initDaysOfWeek = todo.daysOfWeek ?? [];
  const initDaysOfMonth = todo.daysOfMonth ?? [];

  const initHasTime = Boolean(todo.time);
  const initParsed = todo.time ? parseTime(todo.time) : { ampm: '오전', hour: '09', minute: '00' };

  const [title, setTitle] = useState(todo.title);
  const [recurrence, setRecurrence] = useState<Recurrence>(initRecurrence);
  const [date, setDate] = useState(initDate);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initDaysOfWeek);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>(initDaysOfMonth);

  const [ampm, setAmpm] = useState(initParsed.ampm);
  const [hour, setHour] = useState(initParsed.hour);
  const [minute, setMinute] = useState(initParsed.minute);
  const [hasTime, setHasTime] = useState(initHasTime);

  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDayOfWeekPicker, setShowDayOfWeekPicker] = useState(false);
  const [showDayOfMonthPicker, setShowDayOfMonthPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [tempDate, setTempDate] = useState(date);
  const [tempAmpm, setTempAmpm] = useState(ampm);
  const [tempHour, setTempHour] = useState(hour);
  const [tempMinute, setTempMinute] = useState(minute);
  const [tempDaysOfWeek, setTempDaysOfWeek] = useState<number[]>(initDaysOfWeek);
  const [tempDaysOfMonth, setTempDaysOfMonth] = useState<number[]>(initDaysOfMonth);

  const recurrenceFullLabel: Record<Recurrence, string> = {
    '1회': '1회 (반복없음)',
    '매일': '매일',
    '매주': '매주',
    '매월': '매월',
  };

  const timeDisplay = hasTime ? `${ampm} ${hour}:${minute}` : '';

  const dateValue =
    recurrence === '매주' ? formatDaysOfWeek(daysOfWeek) :
    recurrence === '매월' ? formatDaysOfMonth(daysOfMonth) :
    recurrence === '매일' ? '' :
    formatDate(date);

  const dateLabel =
    recurrence === '매주' ? '요일' :
    recurrence === '매월' ? '날짜(매월)' :
    '날짜';

  function handleDateFieldClick() {
    if (recurrence === '매주') {
      setTempDaysOfWeek([...daysOfWeek]);
      setShowDayOfWeekPicker(true);
    } else if (recurrence === '매월') {
      setTempDaysOfMonth([...daysOfMonth]);
      setShowDayOfMonthPicker(true);
    } else if (recurrence === '1회') {
      setTempDate(date);
      setShowCalendar(true);
    }
    // 매일은 날짜 선택 없음
  }

  function handleRecurrenceSelect(value: Recurrence) {
    setRecurrence(value);
    setShowRecurrencePicker(false);
  }

  function confirmCalendar() {
    setDate(tempDate);
    setShowCalendar(false);
  }

  function confirmDayOfWeek() {
    setDaysOfWeek([...tempDaysOfWeek]);
    setShowDayOfWeekPicker(false);
  }

  function confirmDayOfMonth() {
    setDaysOfMonth([...tempDaysOfMonth]);
    setShowDayOfMonthPicker(false);
  }

  function confirmTime() {
    setAmpm(tempAmpm);
    setHour(tempHour);
    setMinute(tempMinute);
    setHasTime(true);
    setShowTimePicker(false);
  }

  function openTimePicker() {
    setTempAmpm(ampm);
    setTempHour(hour);
    setTempMinute(minute);
    setShowTimePicker(true);
  }

  function handleUpdate() {
    const timeStr = hasTime ? buildTimeStr(ampm, hour, minute) : undefined;
    const startDate = recurrence === '1회' ? date : todayISO();
    const endDate = recurrence === '1회' ? date : '2099-12-31';
    onUpdate({
      title: title.trim(),
      startDate,
      endDate,
      time: timeStr,
      recurrence,
      daysOfWeek: recurrence === '매주' ? daysOfWeek : undefined,
      daysOfMonth: recurrence === '매월' ? daysOfMonth : undefined,
    });
  }

  const canUpdate = title.trim().length > 0;

  const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
    { value: '1회', label: '1회 (반복없음)' },
    { value: '매일', label: '매일' },
    { value: '매주', label: '매주' },
    { value: '매월', label: '매월' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* ── Header ── */}
      <div style={{ background: '#fff', padding: '56px 24px 24px', position: 'relative', flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ position: 'absolute', top: 14, left: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}
          aria-label="뒤로"
        >
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(3,18,40,0.70)', margin: '0 0 2px', lineHeight: 1.5 }}>알람 맞추듯 쉽게</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(25,31,40,1.0)', margin: '0 0 4px', lineHeight: 1.2 }}>할 일 수정하기</h1>
        <p style={{ fontSize: 17, fontWeight: 400, color: 'rgba(3,18,40,0.70)', margin: 0, lineHeight: 1.5 }}>멋지게 해낼 수 있도록 도와드릴게요!</p>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: '8px 20px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* 시간 */}
        <UnderlineField
          label="시간"
          value={timeDisplay}
          placeholder="선택 안 함"
          onClick={openTimePicker}
        />

        {/* 날짜 (매일이면 숨김) */}
        {recurrence !== '매일' && (
          <UnderlineField
            label={dateLabel}
            value={dateValue}
            placeholder="선택해 주세요"
            onClick={handleDateFieldClick}
          />
        )}

        {/* 주기 */}
        <UnderlineField
          label="주기"
          value={recurrenceFullLabel[recurrence]}
          placeholder="선택해 주세요"
          onClick={() => setShowRecurrencePicker(true)}
        />

        {/* 할 일 제목 */}
        <div>
          <div style={{ borderBottom: '1.5px solid rgba(0,12,30,0.15)', paddingBottom: 10 }}>
            <p style={{ fontSize: 13, color: 'rgba(0,12,30,0.80)', margin: '0 0 6px', fontWeight: 500 }}>어떤 일인가요?</p>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={50}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 22, fontWeight: 600, color: 'rgba(0,12,30,0.80)', background: 'transparent', padding: 0 }}
            />
          </div>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'rgba(0,19,43,0.58)', margin: '8px 0 0' }}>
            비타민 먹기, 양치하기 등 하고 싶은 일을 가볍게 적어요.
          </p>
        </div>
      </div>

      {/* ── Bottom Buttons ── */}
      <div style={{ padding: '12px 20px 44px', display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            flex: 1, height: 56, borderRadius: 14, border: 'none',
            background: 'rgba(49,130,246,0.16)', color: 'rgba(34,114,235,1.0)',
            fontSize: 17, fontWeight: 600, cursor: 'pointer',
          }}
        >삭제하기</button>
        <button
          onClick={handleUpdate}
          disabled={!canUpdate}
          style={{
            flex: 1, height: 56, borderRadius: 14, border: 'none',
            background: canUpdate ? 'rgba(49,130,246,1.0)' : '#E5E8EB',
            color: canUpdate ? '#fff' : '#b0b8c1',
            fontSize: 17, fontWeight: 600,
            cursor: canUpdate ? 'pointer' : 'default',
          }}
        >수정완료</button>
      </div>

      {/* ── 삭제 확인 시트 ── */}
      {showDeleteConfirm && (
        <BottomSheet onClose={() => setShowDeleteConfirm(false)}>
          <div style={{ padding: '24px 24px 8px' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>할 일을 삭제할까요?</p>
            <p style={{ fontSize: 14, color: '#8b95a1', margin: 0 }}>삭제하면 다시 복구할 수 없어요.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px 34px' }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{ flex: 1, height: 52, borderRadius: 12, border: 'none', background: '#F2F4F6', color: '#4e5968', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
            >취소</button>
            <button
              onClick={onDelete}
              style={{ flex: 2, height: 52, borderRadius: 12, border: 'none', background: '#F04452', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >삭제하기</button>
          </div>
        </BottomSheet>
      )}

      {/* ── 주기 바텀시트 ── */}
      {showRecurrencePicker && (
        <BottomSheet onClose={() => setShowRecurrencePicker(false)}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '20px 0 4px', padding: '0 24px' }}>
            반복되는 주기를 선택해 주세요
          </p>
          <div style={{ paddingBottom: 8 }}>
            {RECURRENCE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleRecurrenceSelect(opt.value)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                  height: 56, padding: '0 24px', fontSize: 16, color: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                {opt.label}
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1L7 7L1 13" stroke="#C9CDD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          <div style={{ height: 34 }} />
        </BottomSheet>
      )}

      {/* ── 달력 바텀시트 ── */}
      {showCalendar && (
        <BottomSheet onClose={() => setShowCalendar(false)}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '20px 0 4px', padding: '0 24px' }}>
            날짜를 선택해 주세요
          </p>
          <CalendarPicker value={tempDate} onChange={setTempDate} />
          <SheetActions onClose={() => setShowCalendar(false)} onConfirm={confirmCalendar} />
        </BottomSheet>
      )}

      {/* ── 요일 바텀시트 ── */}
      {showDayOfWeekPicker && (
        <BottomSheet onClose={() => setShowDayOfWeekPicker(false)}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '20px 0 4px', padding: '0 24px' }}>
            무슨 요일마다 할까요?
          </p>
          <div>
            {DOW_ORDER.map(dow => (
              <CheckRow
                key={dow}
                label={DOW_LABELS[dow]}
                checked={tempDaysOfWeek.includes(dow)}
                onToggle={() => setTempDaysOfWeek(prev => prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow])}
              />
            ))}
          </div>
          <SheetActions
            onClose={() => setShowDayOfWeekPicker(false)}
            onConfirm={confirmDayOfWeek}
            canConfirm={tempDaysOfWeek.length > 0}
          />
        </BottomSheet>
      )}

      {/* ── 날짜(매월) 바텀시트 ── */}
      {showDayOfMonthPicker && (
        <BottomSheet onClose={() => setShowDayOfMonthPicker(false)}>
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '20px 0 2px', padding: '0 24px' }}>
              반복할 날짜를 선택해 주세요
            </p>
            <p style={{ fontSize: 13, color: '#8b95a1', margin: '0 0 8px', padding: '0 24px' }}>
              중복 선택할 수도 있어요.
            </p>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: ITEM_H_DOM * DOM_VISIBLE, flexShrink: 0 }}>
            <CheckRow
              label="매월 말일"
              checked={tempDaysOfMonth.includes(0)}
              onToggle={() => setTempDaysOfMonth(prev => prev.includes(0) ? prev.filter(d => d !== 0) : [...prev, 0])}
            />
            {Array.from({ length: 31 }, (_, i) => i + 1).map(dom => (
              <CheckRow
                key={dom}
                label={`${dom}일`}
                checked={tempDaysOfMonth.includes(dom)}
                onToggle={() => setTempDaysOfMonth(prev => prev.includes(dom) ? prev.filter(d => d !== dom) : [...prev, dom])}
              />
            ))}
          </div>
          <SheetActions
            onClose={() => setShowDayOfMonthPicker(false)}
            onConfirm={confirmDayOfMonth}
            canConfirm={tempDaysOfMonth.length > 0}
          />
        </BottomSheet>
      )}

      {/* ── 시간 바텀시트 ── */}
      {showTimePicker && (
        <BottomSheet onClose={() => setShowTimePicker(false)}>
          <p style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '20px 0 16px', padding: '0 24px' }}>
            시간을 선택해 주세요
          </p>
          <div style={{ display: 'flex', padding: '0 20px', gap: 8 }}>
            <ScrollColumn items={['오전', '오후']} value={tempAmpm} onChange={setTempAmpm} />
            <ScrollColumn items={HOURS} value={tempHour} onChange={setTempHour} />
            <ScrollColumn items={MINUTES} value={tempMinute} onChange={setTempMinute} />
          </div>
          <SheetActions onClose={() => setShowTimePicker(false)} onConfirm={confirmTime} />
        </BottomSheet>
      )}
    </div>
  );
}
