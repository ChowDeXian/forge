import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'forge.state.v2';
const OLD_KEYS = ['forge.state.v1'];

export const EMPTY_SCHEDULE = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };

export const initialState = {
  version: 2,
  settings: { name: '', unit: 'kg', dark: true, restDefault: 90 },
  exercises: [], // user-built library: { id, name, group, equipment, metric, weighted, notes, hasVideo }
  routines: [],
  schedule: { ...EMPTY_SCHEDULE },
  workouts: [],
  activeSession: null,
};

/** Merge a persisted state over current defaults. */
export function mergeSaved(saved) {
  if (!saved || typeof saved !== 'object' || saved.version !== initialState.version) return initialState;
  return {
    ...initialState,
    ...saved,
    settings: { ...initialState.settings, ...(saved.settings || {}) },
    schedule: { ...EMPTY_SCHEDULE, ...(saved.schedule || {}) },
    exercises: Array.isArray(saved.exercises) ? saved.exercises : [],
    routines: Array.isArray(saved.routines) ? saved.routines : [],
    workouts: Array.isArray(saved.workouts) ? saved.workouts : [],
    version: initialState.version,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'setSetting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };

    case 'addExercise':
      return { ...state, exercises: [action.exercise, ...state.exercises] };
    case 'updateExercise':
      return { ...state, exercises: state.exercises.map((e) => (e.id === action.id ? { ...e, ...action.patch } : e)) };
    case 'deleteExercise':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.id),
        routines: state.routines.map((r) => ({ ...r, items: r.items.filter((i) => i.exerciseId !== action.id) })),
      };

    case 'saveRoutine': {
      const exists = state.routines.some((r) => r.id === action.routine.id);
      return {
        ...state,
        routines: exists
          ? state.routines.map((r) => (r.id === action.routine.id ? action.routine : r))
          : [...state.routines, action.routine],
      };
    }
    case 'deleteRoutine': {
      const schedule = { ...state.schedule };
      for (const d of Object.keys(schedule)) if (schedule[d] === action.id) schedule[d] = null;
      return { ...state, schedule, routines: state.routines.filter((r) => r.id !== action.id) };
    }
    case 'setScheduleDay':
      return { ...state, schedule: { ...state.schedule, [action.day]: action.routineId } };

    case 'startSession':
      return { ...state, activeSession: action.session };
    case 'updateSession':
      return state.activeSession ? { ...state, activeSession: { ...state.activeSession, ...action.patch } } : state;
    case 'finishSession': {
      if (!state.activeSession) return state;
      const { id, title, routineId, startedAt, entries } = state.activeSession;
      const workout = {
        id, title, routineId: routineId || null, startedAt,
        durationSec: Math.max(0, Math.round((action.endedAt - startedAt) / 1000)),
        entries: entries.filter((e) => e.sets.some((s) => s.done)).map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })),
      };
      return { ...state, activeSession: null, workouts: [...state.workouts, workout] };
    }
    case 'discardSession':
      return { ...state, activeSession: null };
    case 'deleteWorkout':
      return { ...state, workouts: state.workouts.filter((w) => w.id !== action.id) };

    case 'importState':
      return mergeSaved(action.state);
    default:
      return state;
  }
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => { if (raw) dispatch({ type: 'hydrate', state: mergeSaved(JSON.parse(raw)) }); })
      .catch(() => {})
      .finally(() => setReady(true));
    AsyncStorage.multiRemove(OLD_KEYS).catch(() => {}); // pre-v2 schema: intentional fresh start
  }, []);

  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [state, ready]);

  return <StoreContext.Provider value={{ state, dispatch, ready }}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

export const exerciseById = (state, id) => state.exercises.find((e) => e.id === id) || null;
export const routineById = (state, id) => state.routines.find((r) => r.id === id) || null;
