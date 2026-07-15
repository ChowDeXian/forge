import 'expo'; // installs the web runtime (globalThis.expo) before expo-video and friends evaluate
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';

import { THEMES } from './src/theme';
import { makeStyles } from './src/styles';
import { StoreProvider, useStore, exerciseById } from './src/store';
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
import VelocityScreen from './src/screens/Velocity';
import InstallPrompt from './src/screens/InstallPrompt';
import { House, Dumbbell, Gauge, ChartColumn, User, Play } from 'lucide-react-native';

const TAB_ICON = { home: House, workout: Dumbbell, velocity: Gauge, history: ChartColumn, profile: User };
const TABS = [
  ['home', 'Home'],
  ['workout', 'Workout'],
  ...(Platform.OS === 'web' ? [['velocity', 'Velocity']] : []),
  ['history', 'History'],
  ['profile', 'Profile'],
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { state, dispatch, ready } = useStore();
  const insets = useSafeAreaInsets();
  const t = state.settings.dark ? THEMES.dark : THEMES.light;
  const s = useMemo(() => makeStyles(t, insets), [t, insets.top, insets.bottom, insets.left, insets.right]);

  const [tab, setTab] = useState('home');
  const [installOpen, setInstallOpen] = useState(false);
  const [velocityMounted, setVelocityMounted] = useState(false);
  useEffect(() => { if (tab === 'velocity') setVelocityMounted(true); }, [tab]);
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
    openInstall: () => setInstallOpen(true),
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
          ? routine.items.map((i) => {
              const ex = exerciseById(state, i.exerciseId);
              return {
                exerciseId: i.exerciseId,
                metric: ex ? ex.metric : 'reps',
                weighted: ex ? ex.weighted : true,
                ...(i.supersetId ? { supersetId: i.supersetId } : {}),
                sets: i.sets.map((st) => ({ w: st.w, v: st.v, done: false })),
              };
            })
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
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[s.h1, { letterSpacing: 2 }]}>FORGE</Text>
      </View>
    );
  }

  const loggerOpen = overlay?.type === 'logger' && !!state.activeSession;

  return (
    <View style={s.root}>
      <StatusBar style={state.settings.dark ? 'light' : 'dark'} />

      <View style={{ flex: 1 }}>
        {tab === 'home' && <HomeScreen ui={ui} state={state} startWorkout={startWorkout} setTab={setTab} />}
        {tab === 'workout' && <WorkoutScreen ui={ui} state={state} dispatch={dispatch} startWorkout={startWorkout} />}
        {tab === 'history' && <HistoryScreen ui={ui} state={state} />}
        {tab === 'profile' && <ProfileScreen ui={ui} state={state} dispatch={dispatch} />}
        {/* Velocity stays mounted once visited so an in-progress analysis survives tab switches */}
        {velocityMounted && (
          <View style={{ flex: 1, display: tab === 'velocity' ? 'flex' : 'none' }}>
            <VelocityScreen ui={ui} />
          </View>
        )}
      </View>

      {state.activeSession && !loggerOpen && (
        <ResumeBar s={s} t={t} session={state.activeSession} onPress={() => setOverlay({ type: 'logger' })} />
      )}

      {/* Floating pill nav */}
      <View style={s.nav}>
        {TABS.map(([k, label]) => {
          const active = tab === k;
          const IconCmp = TAB_ICON[k];
          return (
            <Pressable key={k} style={[s.navItem, active && s.navItemActive]} onPress={() => setTab(k)}>
              <IconCmp size={20} strokeWidth={2.2} color={active ? t.onAccent : t.muted} />
              <Text style={[s.navLabel, active && { color: t.onAccent }]}>{label}</Text>
            </Pressable>
          );
        })}
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

      <InstallPrompt ui={ui} open={installOpen} onClose={() => setInstallOpen(false)} />

      <ConfirmModal s={s} t={t} config={confirmCfg} onClose={() => setConfirmCfg(null)} />

      {toastMsg && (
        <View style={s.toast}><Text style={s.toastTxt}>✓ {toastMsg}</Text></View>
      )}
    </View>
  );
}

function ResumeBar({ s, t, session, onPress }) {
  const [, tick] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000));
  return (
    <Pressable style={s.resumeBar} onPress={onPress}>
      <Play size={15} color={t.onAccent} fill={t.onAccent} strokeWidth={2} />
      <Text style={s.resumeTxt}>{session.title}</Text>
      <Text style={s.resumeTimer}>{fmtDuration(elapsed)}</Text>
    </Pressable>
  );
}
