import { useState, useCallback, useEffect } from 'react';
import TodoHome from './components/TodoHome';
import TodoCreate from './components/TodoCreate';
import TodoComplete from './components/TodoComplete';
import type { CompletedTodoInfo } from './components/TodoComplete';
import Toast from './components/Toast';
import { useTodos } from './hooks/useTodos';
import type { Recurrence } from './types/todo';
import './App.css';

type Screen = 'home' | 'create' | 'complete';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<{ message: string; type: 'default' | 'success' } | null>(null);
  const [completedTodo, setCompletedTodo] = useState<CompletedTodoInfo | null>(null);
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodos();

  useEffect(() => {
    import('@apps-in-toss/web-bridge').then(({ setIosSwipeGestureEnabled }) => {
      setIosSwipeGestureEnabled({ isEnabled: false }).catch(() => {});
    }).catch(() => {});

    window.history.pushState({ screen: 'home' }, '');

    function handlePopState() {
      setScreen('home');
      window.history.pushState({ screen: 'home' }, '');
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function goToCreate() {
    window.history.pushState({ screen: 'create' }, '');
    setScreen('create');
  }

  function goToHome() {
    setScreen('home');
    setToast({ message: '해야할 일이 잘 추가됐어요', type: 'success' });
  }

  const handleSubmit = useCallback((
    title: string,
    startDate: string,
    endDate: string,
    time?: string,
    recurrence?: Recurrence,
    daysOfWeek?: number[],
    daysOfMonth?: number[]
  ) => {
    addTodo(title, startDate, endDate, time, recurrence, daysOfWeek, daysOfMonth);
    setCompletedTodo({
      title,
      recurrence: recurrence ?? '1회',
      date: startDate,
      time,
    });
    setScreen('complete');
  }, [addTodo]);

  const handleToggle = useCallback((id: string, date: string) => {
    toggleTodo(id, date);
  }, [toggleTodo]);

  const handleDelete = useCallback((id: string) => {
    deleteTodo(id);
    setToast({ message: '삭제됐어요', type: 'default' });
  }, [deleteTodo]);

  return (
    <>
      {screen === 'home' && (
        <TodoHome
          todos={todos}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onCreateTap={goToCreate}
        />
      )}
      {screen === 'create' && (
        <TodoCreate
          onSubmit={handleSubmit}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'complete' && completedTodo && (
        <TodoComplete
          todo={completedTodo}
          onHome={goToHome}
          onAddMore={goToCreate}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
