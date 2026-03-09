export type Recurrence = '1회' | '매일' | '매주' | '매월';

export interface Todo {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  time?: string;     // HH:mm (optional)
  recurrence?: Recurrence;
  daysOfWeek?: number[];  // 0=일,1=월,...,6=토 (매주)
  daysOfMonth?: number[]; // 1-31, 0=말일 (매월)
  // 1회: isCompleted 사용
  isCompleted: boolean;
  completedAt?: string;
  // 반복 todo: 날짜별 완료 기록 (YYYY-MM-DD[])
  completedDates?: string[];
  createdAt: string;
}

/** 특정 날짜에 이 todo가 완료됐는지 확인 */
export function isCompletedOnDate(todo: Todo, dateStr: string): boolean {
  if (!todo.recurrence || todo.recurrence === '1회') {
    return todo.isCompleted;
  }
  return (todo.completedDates ?? []).includes(dateStr);
}
