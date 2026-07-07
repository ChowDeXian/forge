import 'expo'; // installs the web runtime (globalThis.expo) before expo-video and friends evaluate
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Modal, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';

import { THEMES } from './src/theme';
import { makeStyles } from './src/styles';
import { StoreProvider, useStore } from './src/store';
import { ConfirmModal } from './src/components';
import { uid, fmtDuration } from './src/calc';
import { getVideoUri } from './src/videoStore';

import HomeScreen from './src/screens/Home';
import WorkoutScreen from './src/screens/Workout';
import HistoryScreen from './src/screens/History';
import ProfileScreen from './src/screens/Profile';
import Logger from './src/screens/Logger';
import RoutineEditor from './src/screens/RoutineEditor';
import CreateExercise from './src/screens/CreateExercise';
import WorkoutDetail from './src/screens/WorkoutDetail';

const ICON = { home: '⌂', workout: '✦', history: '▥', profile: '◉' };

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

function Root() {
  const { state, dispatch, ready } = useStore();
  const t = state.settings.dark ? THEMES.dark : THEMES.light;
  const s = useMemo(() => makeStyles(t), [t]);

  const [tab, setTab] = useState('home');
  const [overlay, setOverlay] = useState(null); // {type:'logger'|'routineEditor'|'createExercise'|'workoutDetail'|'player', ...}
  const [toastMsg, setToastMsg] = useState(null);
  const [confirmCfg, setConfirmCfg] = useState(null);
  const toastTimer = useRef(null);

  const toast = (m) => {
    clearTimeout(toastTimer.current);
    setToastMsg(m);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1800);
  };

  // keep the browser chrome / safe areas matching the theme on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = t.bg;
    }
  }, [t]);

  const ui = useMemo(() => ({
    s, t, toast,
    confirm: setConfirmCfg,
    open: setOverlay,
    close: () => setOverlay(null),
  }), [s, t]);

  const beginSession = (routine) => {
    dispatch({
      type: 'startSession',
      session: {
        id: uid(),
        title: routine ? routine.name : 'Empty Workout',
        routineId: routine ? routine.id : null,
        startedAt: Date.now(),
        restUntil: null,
        restTotal: null,
        entries: routine
          ? routine.items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets.map((st) => ({ w: st.w, r: st.r, done: false })) }))
          : [],
      },
    });
    setOverlay({ type: 'logger' });
  };

  const startWorkout = (routine) => {
    if (state.activeSession) {
      setConfirmCfg({
        title: 'Workout in progress',
        message: `"${state.activeSession.title}" is still running. Resume it, or discard it and start fresh?`,
        actions: [
          { label: 'Resume workout', primary: true, onPress: () => setOverlay({ type: 'logger' }) },
          { label: 'Discard & start new', danger: true, onPress: () => { dispatch({ type: 'discardSession' }); beginSession(routine); } },
          { label: 'Cancel' },
        ],
      });
      return;
    }
    beginSession(routine);
  };

  /* demo-video player modal */
  const [playUri, setPlayUri] = useState(null);
  const modalPlayer = useVideoPlayer(null);
  useEffect(() => {
    let cancelled = false;
    if (overlay?.type === 'player') {
      getVideoUri(overlay.exerciseId).then((uri) => {
        if (cancelled) return;
        if (uri) setPlayUri(uri);
        else { toast('No video stored for this exercise'); setOverlay(null); }
      });
    }
    return () => { cancelled = true; };
  }, [overlay]);
  useEffect(() => {
    try {
      if (playUri) { modalPlayer.replace({ uri: playUri }); modalPlayer.play(); }
      else { modalPlayer.pause(); modalPlayer.replace(null); }
    } catch (e) {}
  }, [playUri]);
  const closePlayer = () => {
    if (Platform.OS === 'web' && playUri && playUri.startsWith('blob:')) URL.revokeObjectURL(playUri);
    setPlayUri(null);
    setOverlay(null);
  };

  if (!ready) {
    return (
      <SafeAreaView style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[s.h1, { letterSpacing: 2 }]}>FORGE</Text>
      </SafeAreaView>
    );
  }

  const loggerOpen = overlay?.type === 'logger' && !!state.activeSession;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style={state.settings.dark ? 'light' : 'dark'} />

      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen ui={ui} state={state} startWorkout={startWorkout} setTab={setTab} />}
        {tab === 'workout' && <WorkoutScreen ui={ui} state={state} dispatch={dispatch} startWorkout={startWorkout} />}
        {tab === 'history' && <HistoryScreen ui={ui} state={state} />}
        {tab === 'profile' && <ProfileScreen ui={ui} state={state} dispatch={dispatch} />}
      </View>

      {state.activeSession && !loggerOpen && (
        <ResumeBar s={s} session={state.activeSession} onPress={() => setOverlay({ type: 'logger' })} />
      )}

      {/* Bottom nav */}
      <View style={s.nav}>
        {[['home', 'Home'], ['workout', 'Workout'], ['history', 'History'], ['profile', 'Profile']].map(([k, label]) => (
          <Pressable key={k} style={s.navItem} onPress={() => setTab(k)}>
            <Text style={[s.navIcon, tab === k && { color: t.accent }]}>{ICON[k]}</Text>
            <Text style={[s.navLabel, tab === k && { color: t.accent }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Overlays */}
      {loggerOpen && <Logger ui={ui} state={state} dispatch={dispatch} />}
      {overlay?.type === 'routineEditor' && (
        <RoutineEditor ui={ui} state={state} dispatch={dispatch} routineId={overlay.routineId || null} onClose={() => setOverlay(null)} />
      )}
      {overlay?.type === 'createExercise' && (
        <CreateExercise ui={ui} state={state} dispatch={dispatch} exerciseId={overlay.exerciseId || null} onClose={() => setOverlay(null)} />
      )}
      {overlay?.type === 'workoutDetail' && (
        <WorkoutDetail ui={ui} state={state} dispatch={dispatch} workoutId={overlay.workoutId} onClose={() => setOverlay(null)} />
      )}

      {/* Demo video player */}
      <Modal visible={!!playUri} transparent animationType="fade" onRequestClose={closePlayer}>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={s.grab} />
            <VideoView player={modalPlayer} style={s.videoBox} contentFit="contain" nativeControls />
            <Pressable style={[s.btnGhost, { marginTop: 14 }]} onPress={closePlayer}><Text style={s.btnGhostTxt}>Close</Text></Pressable>
          </View>
        </View>
      </Modal>

      <ConfirmModal s={s} t={t} config={confirmCfg} onClose={() => setConfirmCfg(null)} />

      {toastMsg && (
        <View style={s.toast}><Text style={s.toastTxt}>✓ {toastMsg}</Text></View>
      )}
    </SafeAreaView>
  );
}

function ResumeBar({ s, session, onPress }) {
  const [, tick] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
  return (
    <Pressable style={s.resumeBar} onPress={onPress}>
      <Text style={s.resumeTxt}>▶ {session.title}</Text>
      <Text style={s.resumeTimer}>{fmtDuration(elapsed)}</Text>
    </Pressable>
  );
}
