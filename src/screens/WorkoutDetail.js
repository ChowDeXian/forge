import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SecHead } from '../components';
import { exerciseById } from '../store';
import { workoutVolume, fmtVolume, fmtDurationShort, fmtWeight, epley } from '../calc';

export default function WorkoutDetail({ ui, state, dispatch, workoutId, onClose }) {
  const { s, t, toast, confirm } = ui;
  const unit = state.settings.unit;
  const w = state.workouts.find((x) => x.id === workoutId);
  if (!w) return null;

  const date = new Date(w.startedAt);
  const nSets = w.entries.reduce((a, e) => a + e.sets.length, 0);

  const del = () =>
    confirm({
      title: 'Delete this workout?',
      message: 'It is removed from your history, stats and records.',
      actions: [{ label: 'Cancel' }, { label: 'Delete workout', danger: true, onPress: () => { dispatch({ type: 'deleteWorkout', id: w.id }); toast('Workout deleted'); onClose(); } }],
    });

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.overlayScreen}>
          <Pressable onPress={onClose}><Text style={s.back}>‹ Back</Text></Pressable>
          <Text style={s.h1}>{w.title}</Text>
          <Text style={[s.muted, { marginBottom: 16 }]}>
            {date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>

          <View style={s.statGrid}>
            <View style={s.stat}><Text style={s.statL}>Duration</Text><Text style={s.statV}>{fmtDurationShort(w.durationSec)}</Text></View>
            <View style={s.stat}><Text style={s.statL}>Volume</Text><Text style={[s.statV, { fontSize: 18 }]}>{fmtVolume(workoutVolume(w), unit)}</Text></View>
            <View style={s.stat}><Text style={s.statL}>Sets</Text><Text style={s.statV}>{nSets}</Text></View>
          </View>

          <SecHead s={s}>EXERCISES</SecHead>
          {w.entries.map((e, i) => {
            const ex = exerciseById(state, e.exerciseId);
            const best = e.sets.reduce((a, st) => (epley(st.w, st.r) > epley(a.w, a.r) ? st : a), e.sets[0]);
            return (
              <View key={i} style={s.card}>
                <View style={s.rowBetween}>
                  <Text style={s.exName}>{ex ? ex.name : 'Deleted exercise'}</Text>
                  <Text style={[s.rowEnd, { color: t.accent }]}>{best ? `${fmtWeight(best.w, unit)} × ${best.r}` : ''}</Text>
                </View>
                {e.sets.map((st, si) => (
                  <View key={si} style={[s.rowBetween, { paddingVertical: 5 }]}>
                    <Text style={[s.monoTxt, { color: t.muted }]}>SET {si + 1}</Text>
                    <Text style={[s.monoTxt, { color: t.text, fontWeight: '700' }]}>{fmtWeight(st.w, unit)} × {st.r}</Text>
                  </View>
                ))}
              </View>
            );
          })}

          <Pressable style={[s.btnDanger, { marginTop: 10 }]} onPress={del}><Text style={s.btnDangerTxt}>Delete Workout</Text></Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
