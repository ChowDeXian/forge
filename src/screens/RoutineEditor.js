import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { DragMeter } from '../components';
import { exerciseById, routineById } from '../store';
import {
  uid, kgToDisplay, displayToKg, roundDisplay, weightStepKg, valueStep,
  lastPerformance, fmtValue, parseValueInput, defaultSet,
} from '../calc';
import ExercisePicker, { metricLabel } from './ExercisePicker';

export const VALUE_HEAD = { reps: 'REPS', time: 'TIME', distance: 'DIST' };

export default function RoutineEditor({ ui, state, dispatch, routineId, onClose }) {
  const { s, t, toast, confirm } = ui;
  const unit = state.settings.unit;
  const existing = routineId ? routineById(state, routineId) : null;
  const [name, setName] = useState(existing ? existing.name : '');
  const [items, setItems] = useState(existing ? JSON.parse(JSON.stringify(existing.items)) : []);
  const [picker, setPicker] = useState(null); // { superset: index } | { append: true }

  const patchSet = (ii, si, patch) =>
    setItems((prev) => prev.map((it, i) => (i !== ii ? it : { ...it, sets: it.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) })));
  const addSet = (ii) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== ii) return it;
      const ex = exerciseById(state, it.exerciseId);
      const last = it.sets[it.sets.length - 1] || defaultSet(ex || { weighted: true, metric: 'reps' });
      return { ...it, sets: [...it.sets, { w: last.w, v: last.v }] };
    }));
  const removeSet = (ii, si) =>
    setItems((prev) => prev.map((it, i) => (i !== ii ? it : { ...it, sets: it.sets.filter((_, j) => j !== si) })));
  const move = (ii, dir) =>
    setItems((prev) => {
      const j = ii + dir;
      if (j < 0 || j >= prev.length) return prev;
      const n = [...prev];
      [n[ii], n[j]] = [n[j], n[ii]];
      return n;
    });
  const removeItem = (ii) => setItems((prev) => prev.filter((_, i) => i !== ii));

  const newItem = (ex, supersetId) => {
    const last = lastPerformance(state.workouts, ex.id);
    const base = last && last.metric === ex.metric ? { w: last.w, v: last.v } : defaultSet(ex);
    return { exerciseId: ex.id, ...(supersetId ? { supersetId } : {}), sets: Array.from({ length: 3 }, () => ({ ...base })) };
  };

  const onPick = (ex) => {
    const mode = picker;
    setPicker(null);
    if (mode && mode.superset !== undefined) {
      setItems((prev) => {
        const src = prev[mode.superset];
        const groupId = src.supersetId || uid();
        const n = prev.map((it, i) => (i === mode.superset ? { ...it, supersetId: groupId } : it));
        n.splice(mode.superset + 1, 0, newItem(ex, groupId));
        return n;
      });
      toast('Superset: ' + ex.name);
    } else {
      setItems((prev) => [...prev, newItem(ex)]);
    }
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) { toast('Give the routine a name'); return; }
    if (items.length === 0) { toast('Add at least one exercise'); return; }
    dispatch({ type: 'saveRoutine', routine: { id: existing ? existing.id : uid(), name: trimmed, items } });
    toast('Saved ' + trimmed);
    onClose();
  };
  const del = () =>
    confirm({
      title: `Delete ${existing.name}?`,
      message: 'The routine is removed from your plan and weekly schedule. Past workouts stay in History.',
      actions: [{ label: 'Cancel' }, { label: 'Delete routine', danger: true, onPress: () => { dispatch({ type: 'deleteRoutine', id: existing.id }); toast('Routine deleted'); onClose(); } }],
    });

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.overlayScreen} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onClose}><Text style={s.back}>‹ Cancel</Text></Pressable>
          <Text style={s.h1}>{existing ? 'Edit Routine' : 'New Routine'}</Text>
          <Text style={[s.muted, { marginBottom: 18 }]}>{existing ? 'Adjust exercises and target sets' : 'Build a reusable workout plan'}</Text>

          <Text style={s.fieldLabel}>ROUTINE NAME</Text>
          <View style={s.field}>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Upper A" placeholderTextColor={t.muted} style={s.input} />
          </View>

          <Text style={s.fieldLabel}>EXERCISES</Text>
          {items.length === 0 && (
            <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 10 }]}>No exercises yet — add one below.</Text></View>
          )}
          {items.map((it, ii) => {
            const ex = exerciseById(state, it.exerciseId);
            const metric = ex ? ex.metric : 'reps';
            const weighted = ex ? ex.weighted : true;
            const inSuperset = !!it.supersetId;
            const firstOfGroup = inSuperset && (ii === 0 || items[ii - 1].supersetId !== it.supersetId);
            return (
              <View key={it.exerciseId + '-' + ii} style={[s.card, inSuperset && s.supersetCard]}>
                {firstOfGroup && <Text style={s.supersetTag}>SUPERSET</Text>}
                <View style={s.rowBetween}>
                  <Text style={[s.exName, { flexShrink: 1 }]}>{ex ? ex.name : 'Unknown exercise'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable style={s.iconBtn} onPress={() => move(ii, -1)}><Text style={s.iconBtnTxt}>↑</Text></Pressable>
                    <Pressable style={s.iconBtn} onPress={() => move(ii, +1)}><Text style={s.iconBtnTxt}>↓</Text></Pressable>
                    <Pressable style={s.iconBtn} onPress={() => removeItem(ii)}><Text style={s.iconBtnTxt}>✕</Text></Pressable>
                  </View>
                </View>
                {ex && <Text style={[s.muted, { marginTop: 2 }]}>{metricLabel(metric)}{weighted ? ' · weighted' : ' · bodyweight'}</Text>}
                <View style={[s.setHead, { marginTop: 10 }]}>
                  <Text style={[s.setHeadTxt, { width: 34, textAlign: 'center' }]}>SET</Text>
                  {weighted && <Text style={[s.setHeadTxt, { flex: 1 }]}>WEIGHT</Text>}
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>{VALUE_HEAD[metric]}</Text>
                </View>
                {it.sets.map((st, si) => (
                  <View key={si} style={s.setRow}>
                    <Pressable onLongPress={() => removeSet(ii, si)} style={s.setNo}><Text style={s.setNoTxt}>{si + 1}</Text></Pressable>
                    {weighted && (
                      <DragMeter
                        s={s} t={t}
                        value={roundDisplay(kgToDisplay(st.w, unit), unit)}
                        step={roundDisplay(kgToDisplay(weightStepKg(unit), unit), unit)}
                        format={(v) => `${v} ${unit}`}
                        onCommit={(v) => patchSet(ii, si, { w: Math.round(displayToKg(v, unit) * 100) / 100 })}
                      />
                    )}
                    <DragMeter
                      s={s} t={t}
                      value={st.v}
                      step={valueStep(metric)}
                      format={(v) => fmtValue(metric, v)}
                      parse={(txt) => parseValueInput(metric, txt)}
                      onCommit={(v) => patchSet(ii, si, { v: Math.round(v) })}
                    />
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[s.addSet, { flex: 1 }]} onPress={() => addSet(ii)}><Text style={s.addSetTxt}>+ Set</Text></Pressable>
                  {it.sets.length > 0 && (
                    <Pressable style={[s.addSet, { paddingHorizontal: 14 }]} onPress={() => removeSet(ii, it.sets.length - 1)}>
                      <Text style={s.addSetTxt}>− Set</Text>
                    </Pressable>
                  )}
                  <Pressable style={[s.addSet, { paddingHorizontal: 14 }]} onPress={() => setPicker({ superset: ii })}>
                    <Text style={[s.addSetTxt, { color: t.accent }]}>⇄ Superset</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <Pressable style={s.btnGhost} onPress={() => setPicker({ append: true })}><Text style={s.btnGhostTxt}>＋ Add Exercise</Text></Pressable>

          <Pressable style={[s.btnPrimary, { marginTop: 14 }]} onPress={save}><Text style={s.btnPrimaryTxt}>Save Routine</Text></Pressable>
          {existing && (
            <Pressable style={[s.btnDanger, { marginTop: 10 }]} onPress={del}><Text style={s.btnDangerTxt}>Delete Routine</Text></Pressable>
          )}
        </ScrollView>
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
