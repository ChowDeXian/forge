import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SecHead } from '../components';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { exerciseById } from '../store';
import {
  dayKey, longestStreak, workoutVolume, fmtVolume, fmtDurationShort, fmtWeight, fmtValue,
  oneRmSeries, trainedExerciseIds, personalRecords, relativeDay,
} from '../calc';

const prParts = (p, unit) => {
  if (p.bestOneRm) return { sub: `Heaviest set · ${fmtWeight(p.heaviest.w, unit)} × ${p.heaviest.v}`, end: fmtWeight(p.bestOneRm.val, unit) };
  if (p.mostReps) return { sub: 'Most reps in a set', end: `${p.mostReps.v} reps` };
  if (p.longest) return { sub: p.weighted && p.longest.w > 0 ? `Longest hold · ${fmtWeight(p.longest.w, unit)}` : 'Longest hold', end: fmtValue('time', p.longest.v) };
  if (p.farthest) return { sub: p.weighted && p.farthest.w > 0 ? `Farthest · ${fmtWeight(p.farthest.w, unit)}` : 'Farthest', end: fmtValue('distance', p.farthest.v) };
  return { sub: '', end: '' };
};

export default function HistoryScreen({ ui, state }) {
  const { s, t } = ui;
  const unit = state.settings.unit;
  const workouts = state.workouts;

  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedEx, setSelectedEx] = useState(null);

  const byDay = useMemo(() => {
    const map = {};
    for (const w of workouts) (map[dayKey(w.startedAt)] = map[dayKey(w.startedAt)] || []).push(w);
    return map;
  }, [workouts]);

  const shiftMonth = (d) => {
    setSelectedDay(null);
    setMonth(({ y, m }) => {
      const next = new Date(y, m + d, 1);
      return { y: next.getFullYear(), m: next.getMonth() };
    });
  };

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const leadingBlanks = (new Date(month.y, month.m, 1).getDay() + 6) % 7;
  const todayK = dayKey(Date.now());
  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const trained = useMemo(() => trainedExerciseIds(workouts, 'reps'), [workouts]);
  const chartExId = selectedEx || trained[0] || null;
  const series = useMemo(() => (chartExId ? oneRmSeries(workouts, chartExId).slice(-7) : []), [workouts, chartExId]);
  const prs = useMemo(() => personalRecords(workouts).slice(0, 12), [workouts]);
  const recent = useMemo(() => [...workouts].sort((a, b) => b.startedAt - a.startedAt).slice(0, 15), [workouts]);

  const trendLabel = () => {
    if (series.length < 2) return '';
    const first = series[0].oneRm, last = series[series.length - 1].oneRm;
    if (first <= 0) return '';
    const pct = Math.round(((last - first) / first) * 100);
    return `${pct >= 0 ? '+' : ''}${pct}% · last ${series.length}`;
  };

  const min = series.length ? Math.min(...series.map((p) => p.oneRm)) : 0;
  const max = series.length ? Math.max(...series.map((p) => p.oneRm)) : 0;
  const barH = (v) => (max === min ? 80 : 25 + 75 * ((v - min) / (max - min)));

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.eyebrow}>PROGRESS</Text>
      <Text style={[s.h1, { marginBottom: 14 }]}>History</Text>

      {workouts.length === 0 ? (
        <View style={s.card}>
          <Text style={[s.h2, { marginBottom: 6 }]}>No workouts yet</Text>
          <Text style={s.muted}>Finish your first workout and your calendar, records and progress charts will build themselves here.</Text>
        </View>
      ) : (
        <>
          <View style={s.statGrid}>
            <View style={s.stat}><Text style={s.statL}>Total workouts</Text><Text style={s.statV}>{workouts.length}</Text></View>
            <View style={s.stat}><Text style={s.statL}>Longest streak</Text><Text style={s.statV}>{longestStreak(workouts)}<Text style={s.muted}> d</Text></Text></View>
          </View>

          <View style={s.card}>
            <View style={[s.rowBetween, { marginBottom: 10 }]}>
              <Pressable style={s.calNavBtn} onPress={() => shiftMonth(-1)}><ChevronLeft size={18} color={t.text} strokeWidth={2.4} /></Pressable>
              <Text style={s.h2}>{monthLabel}</Text>
              <Pressable style={s.calNavBtn} onPress={() => shiftMonth(+1)}><ChevronRight size={18} color={t.text} strokeWidth={2.4} /></Pressable>
            </View>
            <View style={s.calGrid}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={'h' + i} style={s.calDow}>{d}</Text>)}
              {Array.from({ length: leadingBlanks }, (_, i) => <View key={'b' + i} style={s.calCell} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const k = `${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                const has = !!byDay[k];
                const isToday = k === todayK;
                const isSel = k === selectedDay;
                return (
                  <Pressable
                    key={k}
                    style={[s.calCell, has && { backgroundColor: t.accent }, isSel && !has && { backgroundColor: t.accentDim }, isToday && !has && { borderWidth: 1, borderColor: t.accent }]}
                    onPress={() => setSelectedDay(has ? k : null)}
                  >
                    <Text style={[s.calTxt, has && { color: t.onAccent, fontWeight: '800' }, isToday && !has && { color: t.accent }]}>{i + 1}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedDay && byDay[selectedDay] && (
              <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 6 }}>
                {byDay[selectedDay].map((w) => (
                  <Pressable key={w.id} style={[s.listRow, { paddingVertical: 10 }]} onPress={() => ui.open({ type: 'workoutDetail', workoutId: w.id })}>
                    <View style={s.ic}><Text style={{ fontSize: 18 }}>🏋️</Text></View>
                    <View style={{ flex: 1 }}><Text style={s.rowTitle}>{w.title}</Text><Text style={s.rowSub}>{fmtDurationShort(w.durationSec)}</Text></View>
                    <Text style={s.rowEnd}>{fmtVolume(workoutVolume(w), unit)}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {trained.length > 0 && chartExId && (
            <>
              <SecHead s={s} right={trendLabel()}>EST. 1RM</SecHead>
              <View style={s.card}>
                <View style={[s.chipsWrap, { marginBottom: 14 }]}>
                  {trained.slice(0, 8).map((id) => {
                    const ex = exerciseById(state, id);
                    if (!ex) return null;
                    const sel = id === chartExId;
                    return (
                      <Pressable key={id} onPress={() => setSelectedEx(id)} style={[s.chip, sel && { backgroundColor: t.accent, borderColor: t.accent }]}>
                        <Text style={[s.chipTxt, sel && { color: t.onAccent }]}>{ex.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {series.length === 0 ? (
                  <Text style={[s.muted, { paddingVertical: 8 }]}>No logged sets for this exercise yet.</Text>
                ) : (
                  <>
                    <View style={[s.chart, { height: 90 }]}>
                      {series.map((p, i) => (
                        <View key={i} style={s.barCol}><View style={[s.bar, { height: `${barH(p.oneRm)}%`, backgroundColor: t.accent }]} /></View>
                      ))}
                    </View>
                    <View style={[s.rowBetween, { marginTop: 8 }]}>
                      <Text style={[s.muted, s.monoTxt]}>{fmtWeight(series[0].oneRm, unit)}</Text>
                      <Text style={[s.muted, s.monoTxt]}>Now · {fmtWeight(series[series.length - 1].oneRm, unit)}</Text>
                    </View>
                  </>
                )}
              </View>
            </>
          )}

          <SecHead s={s} right={`${workouts.length} total`}>WORKOUT LOG</SecHead>
          {recent.map((w) => (
            <Pressable key={w.id} style={[s.card, s.listRow]} onPress={() => ui.open({ type: 'workoutDetail', workoutId: w.id })}>
              <View style={s.ic}><Text style={{ fontSize: 18 }}>🏋️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{w.title}</Text>
                <Text style={s.rowSub}>{relativeDay(w.startedAt)} · {fmtDurationShort(w.durationSec)}</Text>
              </View>
              <Text style={s.rowEnd}>{fmtVolume(workoutVolume(w), unit)}</Text>
            </Pressable>
          ))}

          {prs.length > 0 && <SecHead s={s}>PERSONAL RECORDS</SecHead>}
          {prs.map((p) => {
            const ex = exerciseById(state, p.exerciseId);
            if (!ex) return null;
            const { sub, end } = prParts(p, unit);
            return (
              <View key={p.exerciseId} style={[s.card, s.listRow]}>
                <View style={s.ic}><Text style={{ fontSize: 18 }}>🏆</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{ex.name}</Text>
                  <Text style={s.rowSub}>{sub}</Text>
                </View>
                <Text style={[s.rowEnd, { color: t.accent }]}>{end}</Text>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
