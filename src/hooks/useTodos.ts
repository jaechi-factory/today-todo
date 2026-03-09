import { useState, useEffect, useCallback } from 'react';
import type { Todo, Recurrence } from '../types/todo';

const STORAGE_KEY = 'today-todo-list';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function loadFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function isTodoOnDate(todo: Todo, dateStr: string): boolean {
  if (todo.startDate > dateStr) return false;
  if (todo.endDate < dateStr) return false;

  const date = new Date(dateStr + 'T00:00:00');
  switch (todo.recurrence) {
    case '매일':
      return true;
    case '매주': {
      const dow = date.getDay();
      return (todo.daysOfWeek ?? []).includes(dow);
    }
    case '매월': {
      const dom = date.getDate();
      const lastDom = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      return (todo.daysOfMonth ?? []).some(d => d === dom || (d === 0 && dom === lastDom));
    }
    default:
      return true;
  }
}

/** 특정 날짜에 완료됐는지 확인 */
export function isCompletedOnDate(todo: Todo, dateStr: string): boolean {
  if (!todo.recurrence || todo.recurrence === '1회') {
    return todo.isCompleted;
  }
  return (todo.completedDates ?? []).includes(dateStr);
}

function sortByTime(a: Todo, b: Todo): number {
  const ta = a.time ?? '99:99';
  const tb = b.time ?? '99:99';
  if (ta !== tb) return ta.localeCompare(tb);
  return a.createdAt.localeCompare(b.createdAt);
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(loadFromStorage);

  useEffect(() => {
    saveToStorage(todos);
  }, [todos]);

  const addTodo = useCallback((
    title: string,
    startDate: string,
    endDate: string,
    time?: string,
    recurrence?: Recurrence,
    daysOfWeek?: number[],
    daysOfMonth?: number[]
  ) => {
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      startDate,
      endDate,
      time,
      recurrence,
      daysOfWeek,
      daysOfMonth,
      isCompleted: false,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => [newTodo, ...prev]);
    return newTodo;
  }, []);

  /**
   * date: 토글 기준 날짜 (YYYY-MM-DD)
   * - 1회 todo: isCompleted 전환
   * - 반복 todo: 해당 날짜를 completedDates에 추가/제거
   */
  const toggleTodo = useCallback((id: string, date: string) => {
    setTodos(prev =>
      prev.map(todo => {
        if (todo.id !== id) return todo;

        const isRecurring = todo.recurrence && todo.recurrence !== '1회';

        if (!isRecurring) {
          // 1회: 기존 방식
          return {
            ...todo,
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : undefined,
          };
        }

        // 반복: 날짜별 개별 완료 처리
        const completedDates = todo.completedDates ?? [];
        const alreadyDone = completedDates.includes(date);
        return {
          ...todo,
          completedDates: alreadyDone
            ? completedDates.filter(d => d !== date)
            : [...completedDates, date],
        };
      })
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const todayStr = toDateString(new Date());

  // 하위 호환용 (App.tsx 등에서 쓰지 않지만 남겨둠)
  const todayTodos = todos
    .filter(t => !isCompletedOnDate(t, todayStr) && isTodoOnDate(t, todayStr))
    .sort(sortByTime);

  const completedTodos = todos.filter(t => isCompletedOnDate(t, todayStr));

  return {
    todos,
    todayTodos,
    completedTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
