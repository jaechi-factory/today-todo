import { useState, useRef, useEffect } from 'react';
import type { Recurrence } from '../types/todo';

interface Props {
  onSubmit: (
    title: string,
    startDate: string,
    endDate: string,
    time?: string,
    recurrence?: Recurrence,
    daysOfWeek?: number[],
    daysOfMonth?: number[]
  ) => void;
  onBack: () => void;
}

type Step = 1 | 2 | 3 | 4;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const DOW_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];

const ITEM_H_DOM = 52; // DayOfMonth 아이템 높이
const DOM_VISIBLE = 6.5; // 보이는 아이템 수

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
  label, value, placeholder, dimmed, onClick, showArrow = true, hint,
}: {
  label: string;
  value: string;
  placeholder?: string;
  dimmed?: boolean;
  onClick?: () => void;
  showArrow?: boolean;
  hint?: string;
}) {
  const hasValue = Boolean(value);
  const isEditable = Boolean(onClick);

  // 활성: 어두운 테두리 / 비활성: 연한 테두리
  const borderColor = dimmed ? '#E5E8EB' : '#1a1a1a';
  // 활성+값있음: 진하게 / 비활성+값있음: TDS filled state(#4e5968) / 값없음: placeholder
  const textColor = !dimmed
    ? hasValue ? '#1a1a1a' : '#d1d6db'
    : hasValue ? '#4e5968' : '#b0b8c1';

  return (
    <div>
      <button
        onClick={onClick}
        disabled={!onClick}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: isEditable ? 'pointer' : 'default' }}
      >
        <div style={{ borderBottom: `1.5px solid ${borderColor}`, paddingBottom: 10 }}>
          <p style={{ fontSize: 12, color: dimmed ? '#b0b8c1' : '#8b95a1', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 16, fontWeight: !dimmed && hasValue ? 500 : 400, color: textColor }}>
              {value || placeholder}
            </span>
            {showArrow && isEditable && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke={dimmed ? '#c9cdd2' : '#b0b8c1'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
      </button>
      {hint && <p style={{ fontSize: 12, color: '#b0b8c1', margin: '8px 0 0' }}>{hint}</p>}
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

// ────────── TDS Bottom Sheet ──────────
function BottomSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', background: '#fff', borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 드래그 핸들 */}
        <div style={{ width: 36, height: 4, background: '#E5E8EB', borderRadius: 2, margin: '10px auto 0' }} />
        {children}
      </div>
    </div>
  );
}

// ────────── TDS Sheet Actions ──────────
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
        style={{
          flex: 1, height: 52, borderRadius: 12, border: 'none',
          background: '#F2F4F6', color: '#4e5968', fontSize: 16, fontWeight: 600, cursor: 'pointer',
        }}
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
export default function TodoCreate({ onSubmit, onBack }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('1회');
  const [date, setDate] = useState(todayISO());
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([]);

  const [ampm, setAmpm] = useState('오전');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [hasTime, setHasTime] = useState(false);

  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDayOfWeekPicker, setShowDayOfWeekPicker] = useState(false);
  const [showDayOfMonthPicker, setShowDayOfMonthPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [tempDate, setTempDate] = useState(date);
  const [tempAmpm, setTempAmpm] = useState('오전');
  const [tempHour, setTempHour] = useState('09');
  const [tempMinute, setTempMinute] = useState('00');
  const [tempDaysOfWeek, setTempDaysOfWeek] = useState<number[]>([]);
  const [tempDaysOfMonth, setTempDaysOfMonth] = useState<number[]>([]);

  function getStepQuestion(): string {
    if (step === 1) return '어떤 일인지 알려주세요';
    if (step === 2) return '언제 해야 되나요?';
    if (step === 3) {
      if (recurrence === '매주') return '무슨 요일마다 할까요?';
      if (recurrence === '매월') return '매월 며칠에 할까요?';
      return '날짜를 선택해 주세요';
    }
    return '몇 시에 해야 하나요?';
  }

  function buildTimeStr(ap: string, h: string, m: string): string {
    let h24 = parseInt(h, 10);
    if (ap === '오후' && h24 !== 12) h24 += 12;
    if (ap === '오전' && h24 === 12) h24 = 0;
    return `${String(h24).padStart(2, '0')}:${m}`;
  }

  function doSubmit(timeStr?: string) {
    const startDate = recurrence === '1회' ? date : todayISO();
    const endDate = recurrence === '1회' ? date : '2099-12-31';
    onSubmit(
      title.trim(), startDate, endDate, timeStr, recurrence,
      recurrence === '매주' ? daysOfWeek : undefined,
      recurrence === '매월' ? daysOfMonth : undefined
    );
  }

  function openTimePicker() {
    setTempAmpm(ampm);
    setTempHour(hour);
    setTempMinute(minute);
    setShowTimePicker(true);
  }

  function handleNext() {
    if (step === 1) {
      setStep(2);
      setTimeout(() => setShowRecurrencePicker(true), 100);
      return;
    }
    if (step === 2) {
      handleRecurrenceConfirm(recurrence);
      return;
    }
    if (step === 3) {
      setStep(4);
      setTimeout(() => openTimePicker(), 200);
      return;
    }
    if (step === 4) {
      doSubmit(hasTime ? buildTimeStr(ampm, hour, minute) : undefined);
    }
  }

  function handleBack() {
    if (step === 1) onBack();
    else if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else setStep(recurrence === '매일' ? 2 : 3);
  }

  function handleRecurrenceConfirm(value: Recurrence) {
    setRecurrence(value);
    setShowRecurrencePicker(false);
    setTimeout(() => {
      if (value === '매일') {
        setStep(4);
        openTimePicker();
      } else if (value === '1회') {
        setStep(3);
        setTempDate(date);
        setShowCalendar(true);
      } else if (value === '매주') {
        setStep(3);
        setTempDaysOfWeek([...daysOfWeek]);
        setShowDayOfWeekPicker(true);
      } else {
        setStep(3);
        setTempDaysOfMonth([...daysOfMonth]);
        setShowDayOfMonthPicker(true);
      }
    }, 200);
  }

  function confirmCalendar() {
    setDate(tempDate);
    setShowCalendar(false);
    setTimeout(() => { setStep(4); openTimePicker(); }, 200);
  }

  function confirmDayOfWeek() {
    setDaysOfWeek([...tempDaysOfWeek]);
    setShowDayOfWeekPicker(false);
    setTimeout(() => { setStep(4); openTimePicker(); }, 200);
  }

  function confirmDayOfMonth() {
    setDaysOfMonth([...tempDaysOfMonth]);
    setShowDayOfMonthPicker(false);
    setTimeout(() => { setStep(4); openTimePicker(); }, 200);
  }

  function confirmTime() {
    const timeStr = buildTimeStr(tempAmpm, tempHour, tempMinute);
    setAmpm(tempAmpm);
    setHour(tempHour);
    setMinute(tempMinute);
    setHasTime(true);
    setShowTimePicker(false);
    setTimeout(() => doSubmit(timeStr), 300);
  }

  const timeDisplay = hasTime ? `${ampm} ${hour}:${minute}` : '';
  const canProceed = step === 1 ? title.trim().length > 0 : true;

  const step3Value =
    recurrence === '매주' ? formatDaysOfWeek(daysOfWeek) :
    recurrence === '매월' ? formatDaysOfMonth(daysOfMonth) :
    formatDate(date);

  const recurrenceFullLabel: Record<Recurrence, string> = {
    '1회': '1회 (반복없음)',
    '매일': '매일',
    '매주': '매주',
    '매월': '매월',
  };

  function renderBody() {
    if (step === 1) {
      return (
        <div>
          <div style={{ borderBottom: '1.5px solid #1a1a1a', paddingBottom: 10 }}>
            <p style={{ fontSize: 12, color: '#8b95a1', margin: '0 0 6px', fontWeight: 500 }}>할 일</p>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
              placeholder="예시) 물 마시기"
              maxLength={50}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 16, fontWeight: 500, color: '#1a1a1a', background: 'transparent', padding: 0 }}
            />
          </div>
          <p style={{ fontSize: 12, color: '#b0b8c1', marginTop: 10 }}>
            비타민 먹기, 양치하기 등 하고 싶은 일을 가볍게 적어요.
          </p>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UnderlineField
            label="주기"
            value={recurrenceFullLabel[recurrence]}
            placeholder="선택해 주세요"
            onClick={() => setShowRecurrencePicker(true)}
          />
          <UnderlineField label="할 일" value={title} dimmed showArrow={false} />
        </div>
      );
    }

    if (step === 3) {
      const step3Label = recurrence === '매주' ? '요일' : '날짜';
      const step3OnClick =
        recurrence === '매주' ? () => { setTempDaysOfWeek([...daysOfWeek]); setShowDayOfWeekPicker(true); } :
        recurrence === '매월' ? () => { setTempDaysOfMonth([...daysOfMonth]); setShowDayOfMonthPicker(true); } :
        () => { setTempDate(date); setShowCalendar(true); };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <UnderlineField
            label={step3Label}
            value={step3Value}
            placeholder="선택해 주세요"
            onClick={step3OnClick}
          />
          <UnderlineField label="주기" value={recurrence} dimmed onClick={() => setShowRecurrencePicker(true)} />
          <UnderlineField label="할 일" value={title} dimmed showArrow={false} />
        </div>
      );
    }

    if (step === 4) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <UnderlineField
              label="시간"
              value={timeDisplay}
              placeholder="선택 안 함"
              onClick={() => openTimePicker()}
            />
            {hasTime && (
              <button
                onClick={() => setHasTime(false)}
                style={{ marginTop: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 12, color: '#b0b8c1', textDecoration: 'underline' }}
              >
                시간 선택 취소
              </button>
            )}
          </div>
          {recurrence !== '매일' && (
            <UnderlineField
              label={recurrence === '매주' ? '요일' : '날짜'}
              value={step3Value}
              dimmed
              onClick={
                recurrence === '매주' ? () => { setTempDaysOfWeek([...daysOfWeek]); setShowDayOfWeekPicker(true); } :
                recurrence === '매월' ? () => { setTempDaysOfMonth([...daysOfMonth]); setShowDayOfMonthPicker(true); } :
                () => { setTempDate(date); setShowCalendar(true); }
              }
            />
          )}
          <UnderlineField label="주기" value={recurrence} dimmed onClick={() => setShowRecurrencePicker(true)} />
          <UnderlineField label="할 일" value={title} dimmed showArrow={false} />
        </div>
      );
    }
  }

  const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
    { value: '1회', label: '1회 (반복없음)' },
    { value: '매일', label: '매일' },
    { value: '매주', label: '매주' },
    { value: '매월', label: '매월' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* ── Header (step question만, 프로그레스/부제목 없음) ── */}
      <div style={{ background: '#fff', padding: '56px 20px 24px', position: 'relative', flexShrink: 0 }}>
        <button
          onClick={handleBack}
          style={{ position: 'absolute', top: 14, left: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center' }}
          aria-label="뒤로"
        >
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.35 }}>
          {getStepQuestion()}
        </h2>
      </div>

      {/* ── Body ── */}
      <div
        key={step}
        style={{ flex: 1, padding: '28px 20px', overflowY: 'auto', animation: 'stepBodyIn 0.22s ease-out' }}
      >
        {renderBody()}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ padding: '12px 20px 44px', flexShrink: 0 }}>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: canProceed ? '#3182F6' : '#E5E8EB',
            color: canProceed ? '#fff' : '#b0b8c1',
            fontSize: 16, fontWeight: 700,
            cursor: canProceed ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}
        >
          {step === 4 ? '완료' : '다음'}
        </button>
      </div>

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
                onClick={() => handleRecurrenceConfirm(opt.value)}
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

      {/* ── 날짜(매월) 바텀시트: 6.5개 보이고 스크롤, 버튼 고정 ── */}
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
          {/* 리스트: 6.5개 높이 고정, 내용 스크롤 */}
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
          {/* 버튼 항상 고정 */}
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
