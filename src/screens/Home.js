import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SecHead, Pill } from '../components';
import { Play } from 'lucide-react-native';
import { routineById } from '../store';
import { currentStreak, weeklyVolume, workoutVolume, fmtVolume, fmtDurationShort, relativeDay } from '../calc';
import { todayKey } from './Workout';

export default function HomeScreen({ ui, state, startWorkout, setTab }) {
  const { s, t } = ui;
  const unit = state.settings.unit;
  const workouts = state.workouts;
  const name = state.settings.name.trim();

  const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
  const streak = currentStreak(workouts);
  const todayRoutine = state.schedule[todayKey()] ? routineById(state, state.schedule[todayKey()]) : null;
  const week = weeklyVolume(workouts);
  const maxVol = Math.max(...week.map((d) => d.volume), 1);
  const todayIdx = (new Date().getDay() + 6) % 7;
  const recent = [...workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, 3);
  const initials = (name || 'You').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <View style={s.rowBetween}>
        <View>
          <Text style={s.eyebrow}>{dateStr}</Text>
          <Text style={s.h1}>{name ? `Let's go, ${name.split(' ')[0]}.` : "Let's go."}</Text>
        </View>
        <Pressable style={s.avatar} onPress={() => setTab('profile')}><Text style={s.avatarTxt}>{initials}</Text></Pressable>
      </View>

      {streak > 0 && (
        <View style={[s.streak, { marginBottom: 16 }]}><Text style={s.streakTxt}>🔥 Day {streak} streak</Text></View>
      )}

      {state.activeSession ? (
        <Pressable style={[s.card, s.hero, { marginTop: streak > 0 ? 0 : 16 }]} onPress={() => ui.open({ type: 'logger' })}>
          <Text style={[s.eyebrow, { color: t.accent }]}>IN PROGRESS</Text>
          <Text style={[s.h2, { marginTop: 8 }]}>{state.activeSession.title}</Text>
          <Text style={[s.muted, { marginTop: 4 }]}>Tap to resume your workout</Text>
          <View style={s.play}><Play size={20} color={t.onAccent} fill={t.onAccent} strokeWidth={2} /></View>
        </Pressable>
      ) : todayRoutine ? (
        <Pressable style={[s.card, s.hero, { marginTop: streak > 0 ? 0 : 16 }]} onPress={() => startWorkout(todayRoutine)}>
          <Text style={[s.eyebrow, { color: t.accent }]}>TODAY · PLANNED</Text>
          <Text style={[s.h2, { marginTop: 8 }]}>{todayRoutine.name}</Text>
          <Text style={[s.muted, { marginTop: 4 }]}>
            {[...new Set(todayRoutine.items.map((i) => state.exercises.find((e) => e.id === i.exerciseId)?.group).filter(Boolean))].join(' · ') || 'Planned routine'}
          </Text>
          <View style={s.pillRow}>
            <Pill s={s}>{todayRoutine.items.length} exercises</Pill>
            <Pill s={s} accent t={t}>{todayRoutine.items.reduce((a, i) => a + i.sets.length, 0)} sets</Pill>
          </View>
          <View style={s.play}><Play size={20} color={t.onAccent} fill={t.onAccent} strokeWidth={2} /></View>
        </Pressable>
      ) : (
        <Pressable style={[s.card, s.hero, { marginTop: streak > 0 ? 0 : 16 }]} onPress={() => startWorkout(null)}>
          <Text style={[s.eyebrow, { color: t.accent }]}>TODAY</Text>
          <Text style={[s.h2, { marginTop: 8 }]}>Nothing planned</Text>
          <Text style={[s.muted, { marginTop: 4 }]}>Start an empty workout, or plan your week in the Workout tab.</Text>
          <View style={s.play}><Play size={20} color={t.onAccent} fill={t.onAccent} strokeWidth={2} /></View>
        </Pressable>
      )}

      <SecHead s={s} right={fmtVolume(week.reduce((a, d) => a + d.volume, 0), unit)}>THIS WEEK'S VOLUME</SecHead>
      <View style={s.card}>
        <View style={s.chart}>
          {week.map((d, i) => (
            <View key={i} style={s.barCol}>
              <View style={[s.bar, { height: `${Math.max(4, (d.volume / maxVol) * 100)}%` }, d.volume > 0 && { backgroundColor: t.accent }]} />
              <Text style={[s.barLabel, i === todayIdx && { color: t.accent }]}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
            </View>
          ))}
        </View>
        {week.every((d) => d.volume === 0) && (
          <Text style={[s.muted, { textAlign: 'center', marginTop: 10 }]}>No volume yet this week — today's a good day.</Text>
        )}
      </View>

      {!state.activeSession && (
        <Pressable style={[s.btnGhost, { marginTop: 4 }]} onPress={() => startWorkout(null)}>
          <Text style={s.btnGhostTxt}>+  Start Empty Workout</Text>
        </Pressable>
      )}

      <SecHead s={s}>RECENT ACTIVITY</SecHead>
      {recent.length === 0 ? (
        <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 12 }]}>Your finished workouts will show up here.</Text></View>
      ) : recent.map((w) => (
        <Pressable key={w.id} style={[s.card, s.listRow]} onPress={() => ui.open({ type: 'workoutDetail', workoutId: w.id })}>
          <View style={s.ic}><Text style={{ fontSize: 18 }}>🏋️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.rowTitle}>{w.title}</Text>
            <Text style={s.rowSub}>{relativeDay(w.startedAt)} · {fmtDurationShort(w.durationSec)}</Text>
          </View>
          <Text style={s.rowEnd}>{fmtVolume(workoutVolume(w), unit)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
