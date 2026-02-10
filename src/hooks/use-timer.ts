import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'pm-active-timer';

export interface TimerState {
  status: 'idle' | 'running' | 'paused';
  taskId: string | null;
  taskName: string | null;
  startedAt: string | null;
  elapsedSeconds: number;
  lastResumedAt: string | null;
}

const IDLE_STATE: TimerState = {
  status: 'idle',
  taskId: null,
  taskName: null,
  startedAt: null,
  elapsedSeconds: 0,
  lastResumedAt: null,
};

function loadFromStorage(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return IDLE_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.status && parsed.taskId) return parsed as TimerState;
    return IDLE_STATE;
  } catch {
    return IDLE_STATE;
  }
}

function saveToStorage(state: TimerState) {
  if (state.status === 'idle') {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export function formatElapsedTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function computeDisplay(state: TimerState): number {
  if (state.status === 'running' && state.lastResumedAt) {
    const runningDelta = Math.floor(
      (Date.now() - new Date(state.lastResumedAt).getTime()) / 1000
    );
    return state.elapsedSeconds + Math.max(0, runningDelta);
  }
  return state.elapsedSeconds;
}

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>(loadFromStorage);
  const [displaySeconds, setDisplaySeconds] = useState(() => computeDisplay(loadFromStorage()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist to localStorage whenever timerState changes
  useEffect(() => {
    saveToStorage(timerState);
    setDisplaySeconds(computeDisplay(timerState));
  }, [timerState]);

  // Interval for live updates when running
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(computeDisplay(timerState));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  const startTimer = useCallback((taskId: string, taskName: string) => {
    const now = new Date().toISOString();
    setTimerState({
      status: 'running',
      taskId,
      taskName,
      startedAt: now,
      elapsedSeconds: 0,
      lastResumedAt: now,
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => {
      if (prev.status !== 'running' || !prev.lastResumedAt) return prev;
      const runningDelta = Math.floor(
        (Date.now() - new Date(prev.lastResumedAt).getTime()) / 1000
      );
      return {
        ...prev,
        status: 'paused',
        elapsedSeconds: prev.elapsedSeconds + Math.max(0, runningDelta),
        lastResumedAt: null,
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState((prev) => {
      if (prev.status !== 'paused') return prev;
      return { ...prev, status: 'running', lastResumedAt: new Date().toISOString() };
    });
  }, []);

  const stopTimer = useCallback(() => {
    let result: {
      taskId: string;
      taskName: string;
      startedAt: string;
      endedAt: string;
      hours: number;
    } | null = null;

    setTimerState((prev) => {
      if (prev.status === 'idle' || !prev.taskId || !prev.startedAt) return IDLE_STATE;

      let finalSeconds = prev.elapsedSeconds;
      if (prev.status === 'running' && prev.lastResumedAt) {
        finalSeconds += Math.floor(
          (Date.now() - new Date(prev.lastResumedAt).getTime()) / 1000
        );
      }

      result = {
        taskId: prev.taskId,
        taskName: prev.taskName || '',
        startedAt: prev.startedAt,
        endedAt: new Date().toISOString(),
        hours: parseFloat((Math.max(0, finalSeconds) / 3600).toFixed(2)),
      };

      return IDLE_STATE;
    });

    return result;
  }, []);

  const discardTimer = useCallback(() => {
    setTimerState(IDLE_STATE);
  }, []);

  return {
    timerState,
    displaySeconds,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    discardTimer,
    isRunning: timerState.status === 'running',
    isPaused: timerState.status === 'paused',
    isIdle: timerState.status === 'idle',
  };
}
