import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, SafeAreaView } from 'react-native';
import { Stepper } from '../components';
import { exerciseById, routineById } from '../store';
import { uid, kgToDisplay, displayToKg, roundDisplay, weightStepKg, lastPerformance } from '../calc';
import ExercisePicker from './ExercisePicker';

export default function RoutineEditor({ ui, state, dispatch, routineId, onClose }) {
  const { s, t, toast, confirm } = ui;
  const unit = state.settings.unit;
  const existing = routineId ? routineById(state, routineId) : null;
  const [name, setName] = useState(existing ? existing.name : '');
  const [items, setItems] = useState(existing ? JSON.parse(JSON.stringify(existing.items)) : []);
  const [showPicker, setShowPicker] = useState(false);

  const patchSet = (ii, si, patch) =>
    setItems((prev) => prev.map((it, i) => (i !== ii ? it : { ...it, sets: it.sets.map((st, j) => (j !== si ? st : { ...st, ...patch })) })));
  const addSet = (ii) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== ii) return it;
      const last = it.sets[it.sets.length - 1] || { w: 20, r: 10 };
      return { ...it, sets: [...it.sets, { w: last.w, r: last.r }] };
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
  const addExercise = (ex) => {
    setShowPicker(false);
    const last = lastPerformance(state.workouts, ex.id);
    const w = last ? last.w : 20, r = last ? last.r : 10;
    setItems((prev) => [...prev, { exerciseId: ex.id, sets: Array.from({ length: 3 }, () => ({ w, r })) }]);
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

  const dispW = (kg) => String(roundDisplay(kgToDisplay(kg, unit), unit));

  return (
    <View style={s.overlay}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onClose}><Text style={s.back}>‹ Cancel</Text></Pressable>
          <Text style={s.h1}>{existing ? 'Edit Routine' : 'New Routine'}</Text>
          <Text style={[s.muted, { marginBottom: 18 }]}>{existing ? 'Adjust exercises and target sets' : 'Build a reusable workout plan'}</Text>

          <Text style={s.fieldLabel}>ROUTINE NAME</Text>
          <View style={s.field}>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Push Day A" placeholderTextColor={t.muted} style={s.input} />
          </View>

          <Text style={s.fieldLabel}>EXERCISES</Text>
          {items.length === 0 && (
            <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 10 }]}>No exercises yet — add one below.</Text></View>
          )}
          {items.map((it, ii) => {
            const ex = exerciseById(state, it.exerciseId);
            return (
              <View key={it.exerciseId + '-' + ii} style={s.card}>
                <View style={s.rowBetween}>
                  <Text style={s.exName}>{ex ? ex.name : 'Unknown exercise'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable style={s.iconBtn} onPress={() => move(ii, -1)}><Text style={s.iconBtnTxt}>↑</Text></Pressable>
                    <Pressable style={s.iconBtn} onPress={() => move(ii, +1)}><Text style={s.iconBtnTxt}>↓</Text></Pressable>
                    <Pressable style={s.iconBtn} onPress={() => removeItem(ii)}><Text style={s.iconBtnTxt}>✕</Text></Pressable>
                  </View>
                </View>
                <View style={[s.setHead, { marginTop: 10 }]}>
                  <Text style={[s.setHeadTxt, { width: 34, textAlign: 'center' }]}>SET</Text>
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>WEIGHT</Text>
                  <Text style={[s.setHeadTxt, { flex: 1 }]}>REPS</Text>
                </View>
                {it.sets.map((st, si) => (
                  <View key={si} style={s.setRow}>
                    <Pressable onLongPress={() => removeSet(ii, si)} style={s.setNo}><Text style={s.setNoTxt}>{si + 1}</Text></Pressable>
                    <Stepper
                      s={s} t={t} decimal
                      display={dispW(st.w)} raw={roundDisplay(kgToDisplay(st.w, unit), unit)} unit={unit}
                      onMinus={() => patchSet(ii, si, { w: Math.max(0, Math.round((st.w - weightStepKg(unit)) * 100) / 100) })}
                      onPlus={() => patchSet(ii, si, { w: Math.round((st.w + weightStepKg(unit)) * 100) / 100 })}
                      onCommit={(v) => patchSet(ii, si, { w: Math.round(displayToKg(v, unit) * 100) / 100 })}
                    />
                    <Stepper
                      s={s} t={t}
                      display={String(st.r)} raw={st.r}
                      onMinus={() => patchSet(ii, si, { r: Math.max(0, st.r - 1) })}
                      onPlus={() => patchSet(ii, si, { r: st.r + 1 })}
                      onCommit={(v) => patchSet(ii, si, { r: Math.round(v) })}
                    />
                  </View>
                ))}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[s.addSet, { flex: 1 }]} onPress={() => addSet(ii)}><Text style={s.addSetTxt}>+ Add Set</Text></Pressable>
                  {it.sets.length > 0 && (
                    <Pressable style={[s.addSet, { paddingHorizontal: 14 }]} onPress={() => removeSet(ii, it.sets.length - 1)}>
                      <Text style={s.addSetTxt}>− Set</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          <Pressable style={s.btnGhost} onPress={() => setShowPicker(true)}><Text style={s.btnGhostTxt}>＋ Add Exercise</Text></Pressable>

          <Pressable style={[s.btnPrimary, { marginTop: 14 }]} onPress={save}><Text style={s.btnPrimaryTxt}>Save Routine</Text></Pressable>
          {existing && (
            <Pressable style={[s.btnDanger, { marginTop: 10 }]} onPress={del}><Text style={s.btnDangerTxt}>Delete Routine</Text></Pressable>
          )}
        </ScrollView>
      </SafeAreaView>

      {showPicker && (
        <ExercisePicker ui={ui} exercises={state.exercises} onPick={addExercise} onClose={() => setShowPicker(false)} />
      )}
    </View>
  );
}
