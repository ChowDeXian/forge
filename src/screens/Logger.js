import React, { useEffect, useReducer, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Stepper } from '../components';
import { exerciseById } from '../store';
import {
  fmtDuration, kgToDisplay, displayToKg, roundDisplay, weightStepKg, lastPerformance, fmtWeight,
} from '../calc';
import ExercisePicker from './ExercisePicker';

export default function Logger({ ui, state, dispatch }) {
  const { s, t, toast, confirm, close } = ui;
  const session = state.activeSession;
  const unit = state.settings.unit;
  const [showPicker, setShowPicker] = useState(false);

  // re-render every second for the timers
  const [, tick] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!session) return null;

  const now = Date.now();
  const elapsed = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const restLeft = session.restUntil ? Math.max(0, Math.ceil((session.restUntil - now) / 1000)) : 0;
  const restTotal = session.restTotal || state.settings.restDefault;

  const setEntries = (entries) => dispatch({ type: 'updateSession', patch: { entries } });
  const patchSet = (ei, si, patch) =>
    setEntries(session.entries.map((e, i) =>
      i !== ei ? e : { ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) }));

  const stepW = (ei, si, dir) => {
    const cur = session.entries[ei].sets[si].w;
    patchSet(ei, si, { w: Math.max(0, Math.round((cur + dir * weightStepKg(unit)) * 100) / 100) });
  };
  const stepR = (ei, si, dir) => {
    const cur = session.entries[ei].sets[si].r;
    patchSet(ei, si, { r: Math.max(0, cur + dir) });
  };
  const toggleDone = (ei, si) => {
    const done = !session.entries[ei].sets[si].done;
    dispatch({
      type: 'updateSession',
      patch: {
        entries: session.entries.map((e, i) =>
          i !== ei ? e : { ...e, sets: e.sets.map((st, j) => (j !== si ? st : { ...st, done })) }),
        ...(done ? { restUntil: Date.now() + state.settings.restDefault * 1000, restTotal: state.settings.restDefault } : {}),
      },
    });
  };
  const addSet = (ei) => {
    const sets = session.entries[ei].sets;
    const last = sets[sets.length - 1] || { w: 20, r: 10 };
    setEntries(session.entries.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { w: last.w, r: last.r, done: false }] })));
  };
  const removeSet = (ei, si) =>
    setEntries(session.entries.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) })));
  const removeExercise = (ei) => {
    const name = exerciseById(state, session.entries[ei].exerciseId)?.name || 'exercise';
    confirm({
      title: `Remove ${name}?`,
      message: 'Its sets in this workout will be removed.',
      actions: [{ label: 'Cancel' }, { label: 'Remove', danger: true, onPress: () => setEntries(session.entries.filter((_, i) => i !== ei)) }],
    });
  };
  const addExercise = (ex) => {
    setShowPicker(false);
    const last = lastPerformance(state.workouts, ex.id);
    const w = last ? last.w : 20, r = last ? last.r : 10;
    setEntries([...session.entries, { exerciseId: ex.id, sets: Array.from({ length: 3 }, () => ({ w, r, done: false })) }]);
    toast('Added ' + ex.name);
  };

  const doneCount = session.entries.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
  const finish = () => {
    if (doneCount === 0) {
      confirm({
        title: 'Nothing logged yet',
        message: 'No sets are checked off. Discard this workout?',
        actions: [{ label: 'Keep going' }, { label: 'Discard workout', danger: true, onPress: () => { dispatch({ type: 'discardSession' }); close(); } }],
      });
      return;
    }
    confirm({
      title: 'Finish workout?',
      message: `You logged ${doneCount} sets in ${fmtDuration(elapsed).slice(3)}. Nice work.`,
      actions: [
        { label: 'Keep going' },
        { label: 'Finish & Save', primary: true, onPress: () => { dispatch({ type: 'finishSession', endedAt: Date.now() }); close(); toast('Workout saved 🏆'); } },
      ],
    });
  };
  const discard = () =>
    confirm({
      title: 'Discard workout?',
      message: 'This workout will not be saved.',
      actions: [{ label: 'Keep going' }, { label: 'Discard', danger: true, onPress: () => { dispatch({ type: 'discardSession' }); close(); } }],
    });

  const dispW = (kg) => {
    const v = roundDisplay(kgToDisplay(kg, unit), unit);
    return Number.isInteger(v) ? String(v) : String(v);
  };

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <View style={s.loggerHead}>
          <View style={s.rowBetween}>
            <Pressable onPress={close}><Text style={s.back}>‹ Minimise</Text></Pressable>
            <Text style={s.bigTimer}>{fmtDuration(elapsed)}</Text>
          </View>
          {restLeft > 0 && (
            <View style={s.restPill}>
              <Text style={s.restText}>⏱ Rest {restLeft}s</Text>
              <View style={s.restBarTrack}><View style={[s.restBarFill, { width: `${Math.min(100, (restLeft / restTotal) * 100)}%` }]} /></View>
              <Pressable onPress={() => dispatch({ type: 'updateSession', patch: { restUntil: session.restUntil + 30000 } })}><Text style={s.restText}>+30s</Text></Pressable>
              <Pressable onPress={() => dispatch({ type: 'updateSession', patch: { restUntil: null } })}><Text style={s.restText}>Skip</Text></Pressable>
            </View>
          )}
          <TextInput
            value={session.title}
            onChangeText={(v) => dispatch({ type: 'updateSession', patch: { title: v } })}
            style={[s.h1, { paddingVertical: 2 }]}
            placeholder="Workout name"
            placeholderTextColor={t.muted}
          />
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
          {session.entries.length === 0 && (
            <View style={s.card}><Text style={s.muted}>Empty workout — add an exercise to get started.</Text></View>
          )}
          {session.entries.map((entry, ei) => {
            const ex = exerciseById(state, entry.exerciseId);
            const last = lastPerformance(state.workouts, entry.exerciseId);
            return (
              <View key={entry.exerciseId + '-' + ei} style={s.card}>
                <View style={s.rowBetween}>
                  <Text style={s.exName}>{ex ? ex.name : 'Unknown exercise'}</Text>
                  <Pressable style={s.iconBtn} onPress={() => removeExercise(ei)}><Text style={s.iconBtnTxt}>✕</Text></Pressable>
                </View>
                <Text style={[s.muted, { marginBottom: 12 }]}>
                  {last ? `Last time: ${fmtWeight(last.w, unit)} × ${last.r}` : 'First time — set your numbers'}
                </Text>
                <View style={s.setHead}>
                  <Text style={[s.setHeadTxt, { width: 34, textAlign: 'center' }]}>SET</Text>
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>WEIGHT</Text>
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>REPS</Text>
                  <Text style={[s.setHeadTxt, { width: 44, textAlign: 'center' }]}>✓</Text>
                </View>
                {entry.sets.map((st, si) => (
                  <View key={si} style={s.setRow}>
                    <Pressable
                      onLongPress={() => removeSet(ei, si)}
                      style={[s.setNo, st.done && { backgroundColor: t.accent }]}
                    >
                      <Text style={[s.setNoTxt, st.done && { color: t.onAccent }]}>{si + 1}</Text>
                    </Pressable>
                    <Stepper
                      s={s} t={t} decimal
                      display={dispW(st.w)} raw={roundDisplay(kgToDisplay(st.w, unit), unit)} unit={unit}
                      onMinus={() => stepW(ei, si, -1)} onPlus={() => stepW(ei, si, +1)}
                      onCommit={(v) => patchSet(ei, si, { w: Math.round(displayToKg(v, unit) * 100) / 100 })}
                    />
                    <Stepper
                      s={s} t={t}
                      display={String(st.r)} raw={st.r}
                      onMinus={() => stepR(ei, si, -1)} onPlus={() => stepR(ei, si, +1)}
                      onCommit={(v) => patchSet(ei, si, { r: Math.round(v) })}
                    />
                    <Pressable onPress={() => toggleDone(ei, si)} style={[s.check, st.done && { backgroundColor: t.accent, borderColor: t.accent }]}>
                      <Text style={{ color: st.done ? t.onAccent : t.muted, fontWeight: '800', fontSize: 16 }}>✓</Text>
                    </Pressable>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[s.addSet, { flex: 1 }]} onPress={() => addSet(ei)}><Text style={s.addSetTxt}>+ Add Set</Text></Pressable>
                  {entry.sets.length > 0 && (
                    <Pressable style={[s.addSet, { paddingHorizontal: 14 }]} onPress={() => removeSet(ei, entry.sets.length - 1)}>
                      <Text style={s.addSetTxt}>− Set</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          <Pressable style={[s.btnGhost, { marginTop: 4 }]} onPress={() => setShowPicker(true)}>
            <Text style={s.btnGhostTxt}>＋ Add Exercise</Text>
          </Pressable>
        </ScrollView>

        <View style={s.finishBar}>
          <Pressable style={s.btnPrimary} onPress={finish}><Text style={s.btnPrimaryTxt}>Finish Workout</Text></Pressable>
          <Pressable onPress={discard}><Text style={[s.muted, { textAlign: 'center' }]}>Discard workout</Text></Pressable>
        </View>
      </View>

      {showPicker && (
        <ExercisePicker ui={ui} exercises={state.exercises} onPick={addExercise} onClose={() => setShowPicker(false)} />
      )}
    </View>
  );
}
