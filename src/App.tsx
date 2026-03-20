import { useState, useCallback, useEffect, useRef } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-bridge';
import TodoHome from './components/TodoHome';
import TodoCreate from './components/TodoCreate';
import TodoEdit from './components/TodoEdit';
import TodoComplete from './components/TodoComplete';
import type { CompletedTodoInfo } from './components/TodoComplete';
import Toast from './components/Toast';
import { useTodos } from './hooks/useTodos';
import type { Todo, Recurrence } from './types/todo';
import './App.css';

type Screen = 'home' | 'create' | 'complete' | 'edit';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [toast, setToast] = useState<{ message: string; type: 'default' | 'success' } | null>(null);
  const ad1Loaded = useRef(false);
  const ad2Loaded = useRef(false);

  function preloadAd1() {
    if (!loadFullScreenAd.isSupported()) return;
    loadFullScreenAd({
      options: { adGroupId: 'ait.v2.live.5f49bd03ab6a45f0' },
      onEvent: (e) => { if (e.type === 'loaded') ad1Loaded.current = true; },
      onError: () => {},
    });
  }

  function preloadAd2() {
    if (!loadFullScreenAd.isSupported()) return;
    loadFullScreenAd({
      options: { adGroupId: 'ait.v2.live.79831ac019c34997' },
      onEvent: (e) => { if (e.type === 'loaded') ad2Loaded.current = true; },
      onError: () => {},
    });
  }

  function showAd1ThenRun(callback: () => void) {
    if (ad1Loaded.current && showFullScreenAd.isSupported()) {
      ad1Loaded.current = false;
      showFullScreenAd({
        options: { adGroupId: 'ait.v2.live.5f49bd03ab6a45f0' },
        onEvent: (e) => {
          if (e.type === 'dismissed' || e.type === 'failedToShow') {
            callback();
            preloadAd1();
          }
        },
        onError: () => callback(),
      });
    } else {
      callback();
    }
  }

  function showAd2ThenRun(callback: () => void) {
    if (ad2Loaded.current && showFullScreenAd.isSupported()) {
      ad2Loaded.current = false;
      showFullScreenAd({
        options: { adGroupId: 'ait.v2.live.79831ac019c34997' },
        onEvent: (e) => {
          if (e.type === 'dismissed' || e.type === 'failedToShow') {
            callback();
            preloadAd2();
          }
        },
        onError: () => callback(),
      });
    } else {
      callback();
    }
  }
  const [completedTodo, setCompletedTodo] = useState<CompletedTodoInfo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodos();

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

  useEffect(() => {
    preloadAd1();
    preloadAd2();
  }, []);

  function goToCreate() {
    if (todos.length === 0) {
      window.history.pushState({ screen: 'create' }, '');
      setScreen('create');
    } else {
      showAd1ThenRun(() => {
        window.history.pushState({ screen: 'create' }, '');
        setScreen('create');
      });
    }
  }

  function goToHome() {
    showAd2ThenRun(() => {
      setScreen('home');
      setToast({ message: '해야할 일이 잘 추가됐어요', type: 'success' });
    });
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

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo);
    window.history.pushState({ screen: 'edit' }, '');
    setScreen('edit');
  }, []);

  const handleUpdate = useCallback((
    updates: Partial<Omit<Todo, 'id' | 'createdAt' | 'isCompleted' | 'completedAt' | 'completedDates'>>
  ) => {
    if (!editingTodo) return;
    updateTodo(editingTodo.id, updates);
    setEditingTodo(null);
    setScreen('home');
    setToast({ message: '수정됐어요', type: 'success' });
  }, [editingTodo, updateTodo]);

  const handleDeleteFromEdit = useCallback(() => {
    if (!editingTodo) return;
    deleteTodo(editingTodo.id);
    setEditingTodo(null);
    setScreen('home');
    setToast({ message: '삭제됐어요', type: 'default' });
  }, [editingTodo, deleteTodo]);

  return (
    <>
      {screen === 'home' && (
        <TodoHome
          todos={todos}
          onToggle={handleToggle}
          onEdit={handleEdit}
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
      {screen === 'edit' && editingTodo && (
        <TodoEdit
          todo={editingTodo}
          onUpdate={handleUpdate}
          onDelete={handleDeleteFromEdit}
          onBack={() => setScreen('home')}
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
