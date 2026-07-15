import React, { useEffect, useReducer, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { DragMeter, BackButton } from '../components';
import { Repeat, X } from 'lucide-react-native';
import { exerciseById } from '../store';
import {
  uid, fmtDuration, kgToDisplay, displayToKg, roundDisplay, weightStepKg, valueStep,
  lastPerformance, fmtSet, fmtValue, parseValueInput, defaultSet,
} from '../calc';
import ExercisePicker from './ExercisePicker';
import { VALUE_HEAD } from './RoutineEditor';

export default function Logger({ ui, state, dispatch }) {
  const { s, t, toast, confirm, close } = ui;
  const session = state.activeSession;
  const unit = state.settings.unit;
  const [picker, setPicker] = useState(null); // { superset: index } | { append: true }

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
    const entry = session.entries[ei];
    const last = entry.sets[entry.sets.length - 1] || defaultSet(entry);
    setEntries(session.entries.map((e, i) => (i !== ei ? e : { ...e, sets: [...e.sets, { w: last.w, v: last.v, done: false }] })));
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

  const newEntry = (ex, supersetId) => {
    const last = lastPerformance(state.workouts, ex.id);
    const base = last && last.metric === ex.metric ? { w: last.w, v: last.v } : defaultSet(ex);
    return {
      exerciseId: ex.id, metric: ex.metric, weighted: ex.weighted,
      ...(supersetId ? { supersetId } : {}),
      sets: Array.from({ length: 3 }, () => ({ ...base, done: false })),
    };
  };
  const onPick = (ex) => {
    const mode = picker;
    setPicker(null);
    if (mode && mode.superset !== undefined) {
      const src = session.entries[mode.superset];
      const groupId = src.supersetId || uid();
      const entries = session.entries.map((e, i) => (i === mode.superset ? { ...e, supersetId: groupId } : e));
      entries.splice(mode.superset + 1, 0, newEntry(ex, groupId));
      setEntries(entries);
      toast('Superset: ' + ex.name);
    } else {
      setEntries([...session.entries, newEntry(ex)]);
      toast('Added ' + ex.name);
    }
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

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <View style={s.loggerHead}>
          <View style={s.rowBetween}>
            <BackButton s={s} t={t} label="Minimise" onPress={close} />
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
            const metric = entry.metric || 'reps';
            const weighted = entry.weighted !== undefined ? entry.weighted : true;
            const last = lastPerformance(state.workouts, entry.exerciseId);
            const inSuperset = !!entry.supersetId;
            const firstOfGroup = inSuperset && (ei === 0 || session.entries[ei - 1].supersetId !== entry.supersetId);
            return (
              <View key={entry.exerciseId + '-' + ei} style={[s.card, inSuperset && s.supersetCard]}>
                {firstOfGroup && <Text style={s.supersetTag}>SUPERSET</Text>}
                <View style={s.rowBetween}>
                  <Text style={[s.exName, { flexShrink: 1 }]}>{ex ? ex.name : 'Unknown exercise'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable style={s.iconBtn} onPress={() => setPicker({ superset: ei })}><Repeat size={15} color={t.accent} strokeWidth={2.4} /></Pressable>
                    <Pressable style={s.iconBtn} onPress={() => removeExercise(ei)}><X size={15} color={t.muted} strokeWidth={2.4} /></Pressable>
                  </View>
                </View>
                <Text style={[s.muted, { marginBottom: 12 }]}>
                  {last ? `Last time: ${fmtSet(last.metric, last.weighted, last.w, last.v, unit)}` : 'First time — set your numbers'}
                </Text>
                <View style={s.setHead}>
                  <Text style={[s.setHeadTxt, { width: 34, textAlign: 'center' }]}>SET</Text>
                  {weighted && <Text style={[s.setHeadTxt, { flex: 1 }]}>WEIGHT</Text>}
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>{VALUE_HEAD[metric]}</Text>
                  <Text style={[s.setHeadTxt, { width: 44, textAlign: 'center' }]}>✓</Text>
                </View>
                {entry.sets.map((st, si) => (
                  <View key={si} style={s.setRow}>
                    <Pressable onLongPress={() => removeSet(ei, si)} style={[s.setNo, st.done && { backgroundColor: t.accent }]}>
                      <Text style={[s.setNoTxt, st.done && { color: t.onAccent }]}>{si + 1}</Text>
                    </Pressable>
                    {weighted && (
                      <DragMeter
                        s={s} t={t}
                        value={roundDisplay(kgToDisplay(st.w, unit), unit)}
                        step={roundDisplay(kgToDisplay(weightStepKg(unit), unit), unit)}
                        format={(v) => `${v} ${unit}`}
                        onCommit={(v) => patchSet(ei, si, { w: Math.round(displayToKg(v, unit) * 100) / 100 })}
                      />
                    )}
                    <DragMeter
                      s={s} t={t}
                      value={st.v}
                      step={valueStep(metric)}
                      format={(v) => fmtValue(metric, v)}
                      parse={(txt) => parseValueInput(metric, txt)}
                      onCommit={(v) => patchSet(ei, si, { v: Math.round(v) })}
                    />
                    <Pressable onPress={() => toggleDone(ei, si)} style={[s.check, st.done && { backgroundColor: t.accent, borderColor: t.accent }]}>
                      <Text style={{ color: st.done ? t.onAccent : t.muted, fontWeight: '800', fontSize: 16 }}>✓</Text>
                    </Pressable>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[s.addSet, { flex: 1 }]} onPress={() => addSet(ei)}><Text style={s.addSetTxt}>+ Set</Text></Pressable>
                  {entry.sets.length > 0 && (
                    <Pressable style={[s.addSet, { paddingHorizontal: 14 }]} onPress={() => removeSet(ei, entry.sets.length - 1)}>
                      <Text style={s.addSetTxt}>− Set</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          <Pressable style={[s.btnGhost, { marginTop: 4 }]} onPress={() => setPicker({ append: true })}>
            <Text style={s.btnGhostTxt}>＋ Add Exercise</Text>
          </Pressable>
        </ScrollView>

        <View style={s.finishBar}>
          <Pressable style={s.btnPrimary} onPress={finish}><Text style={s.btnPrimaryTxt}>Finish Workout</Text></Pressable>
          <Pressable onPress={discard}><Text style={[s.muted, { textAlign: 'center' }]}>Discard workout</Text></Pressable>
        </View>
      </View>

      {picker && (
        <ExercisePicker
          ui={ui}
          exercises={state.exercises}
          title={picker.superset !== undefined ? 'Superset With' : 'Add Exercise'}
          onPick={onPick}
          onClose={() => setPicker(null)}
        />
      )}
    </View>
  );
}
