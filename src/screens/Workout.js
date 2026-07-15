import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SecHead } from '../components';
import { routineById } from '../store';
import ExercisePicker, { metricLabel } from './ExercisePicker';
import { Play } from 'lucide-react-native';

export const DAYS = [['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'], ['sat', 'Sat'], ['sun', 'Sun']];
export const todayKey = () => DAYS[(new Date().getDay() + 6) % 7][0];

export default function WorkoutScreen({ ui, state, dispatch, startWorkout }) {
  const { s, t } = ui;
  const [pickDay, setPickDay] = useState(null);   // day key being scheduled
  const [browse, setBrowse] = useState(false);    // library browser
  const exercises = state.exercises;
  const today = todayKey();

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.eyebrow}>PLAN</Text>
      <Text style={[s.h1, { marginBottom: 16 }]}>Workout</Text>

      <Pressable style={s.btnPrimary} onPress={() => startWorkout(null)}><Text style={s.btnPrimaryTxt}>▶  Start Empty Workout</Text></Pressable>
      <Pressable style={[s.btnGhost, { marginTop: 10 }]} onPress={() => ui.open({ type: 'routineEditor' })}><Text style={s.btnGhostTxt}>+  Create Routine</Text></Pressable>
      <Pressable style={[s.btnGhost, { marginTop: 10 }]} onPress={() => ui.open({ type: 'createExercise' })}><Text style={s.btnGhostTxt}>＋  Create Exercise</Text></Pressable>

      <SecHead s={s} right={`${state.routines.length}`}>MY ROUTINES</SecHead>
      {state.routines.length === 0 ? (
        <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 14 }]}>No routines yet.{'\n'}Tap Create Routine to build your plan.</Text></View>
      ) : state.routines.map((r) => {
        const nSets = r.items.reduce((a, i) => a + i.sets.length, 0);
        return (
          <Pressable key={r.id} style={[s.card, s.listRow]} onPress={() => ui.open({ type: 'routineEditor', routineId: r.id })}>
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>{r.name}</Text>
              <Text style={s.rowSub}>{r.items.length} exercises · {nSets} sets</Text>
            </View>
            <Pressable style={[s.pill, { backgroundColor: t.accent, borderColor: t.accent, flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={() => startWorkout(r)}>
              <Play size={12} color={t.onAccent} fill={t.onAccent} strokeWidth={2} />
              <Text style={{ color: t.onAccent, fontWeight: '700', fontSize: 12 }}>Start</Text>
            </Pressable>
          </Pressable>
        );
      })}

      <SecHead s={s} right="tap a day to plan">WEEKLY SCHEDULE</SecHead>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {DAYS.map(([key, label]) => {
          const routine = state.schedule[key] ? routineById(state, state.schedule[key]) : null;
          const isToday = key === today;
          return (
            <Pressable
              key={key}
              onPress={() => setPickDay(key)}
              style={[s.dayBox, routine ? { borderColor: t.accent, backgroundColor: t.accentDim } : { opacity: 0.75 }, isToday && { borderWidth: 2, borderColor: t.accent }]}
            >
              <Text style={[s.dayD, isToday && { color: t.accent }]}>{label.toUpperCase()}</Text>
              <Text style={s.dayW}>{routine ? routine.name : 'Rest'}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <SecHead s={s} right={`${exercises.length}`}>MY EXERCISES</SecHead>
      {exercises.length === 0 ? (
        <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 14 }]}>Your library is empty.{'\n'}Tap Create Exercise to build it — everything else starts there.</Text></View>
      ) : exercises.map((x) => (
        <Pressable key={x.id} style={[s.card, s.listRow]} onPress={() => ui.open({ type: 'createExercise', exerciseId: x.id })}>
          <View style={s.ic}><Text style={{ fontSize: 18 }}>{x.hasVideo ? '🎬' : '🏋️'}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{x.name}</Text>
            <Text style={s.rowSub}>{x.group} · {x.equipment} · {metricLabel(x.metric)}{x.weighted ? '' : ' · BW'}</Text>
          </View>
          {x.hasVideo && (
            <Pressable style={[s.pill, { backgroundColor: t.accentDim }]} onPress={() => ui.open({ type: 'player', exerciseId: x.id })}>
              <Text style={{ color: t.accent, fontWeight: '700', fontSize: 12 }}>▶ Play</Text>
            </Pressable>
          )}
        </Pressable>
      ))}
      <Pressable style={[s.btnGhost, { marginTop: 4 }]} onPress={() => setBrowse(true)}>
        <Text style={s.btnGhostTxt}>Browse exercise library</Text>
      </Pressable>
    </ScrollView>

      {/* schedule day picker */}
      <Modal visible={!!pickDay} transparent animationType="fade" onRequestClose={() => setPickDay(null)}>
        <Pressable style={s.modalBg} onPress={() => setPickDay(null)}>
          <Pressable style={s.modal} onPress={() => {}}>
            <View style={s.grab} />
            <Text style={[s.h2, { marginBottom: 14 }]}>{pickDay ? `Plan for ${DAYS.find(([k]) => k === pickDay)[1]}` : ''}</Text>
            <Pressable
              style={[s.btnGhost, { marginBottom: 9 }]}
              onPress={() => { dispatch({ type: 'setScheduleDay', day: pickDay, routineId: null }); setPickDay(null); }}
            >
              <Text style={s.btnGhostTxt}>Rest day</Text>
            </Pressable>
            {state.routines.map((r) => (
              <Pressable
                key={r.id}
                style={[s.btnGhost, { marginBottom: 9 }, state.schedule[pickDay] === r.id && { borderColor: t.accent, backgroundColor: t.accentDim }]}
                onPress={() => { dispatch({ type: 'setScheduleDay', day: pickDay, routineId: r.id }); setPickDay(null); }}
              >
                <Text style={[s.btnGhostTxt, state.schedule[pickDay] === r.id && { color: t.accent }]}>{r.name}</Text>
              </Pressable>
            ))}
            {state.routines.length === 0 && <Text style={[s.muted, { textAlign: 'center', paddingVertical: 8 }]}>Create a routine first to plan your week.</Text>}
          </Pressable>
        </Pressable>
      </Modal>

      {browse && (
        <ExercisePicker
          ui={ui}
          exercises={state.exercises}
          title="Exercise Library"
          onPick={(x) => { setBrowse(false); ui.open({ type: 'createExercise', exerciseId: x.id }); }}
          onClose={() => setBrowse(false)}
          onCreateNew={() => { setBrowse(false); ui.open({ type: 'createExercise' }); }}
        />
      )}
    </View>
  );
}
