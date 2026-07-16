import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { BackButton, SecHead } from '../components';
import { exerciseById } from '../store';
import {
  exerciseSessions, kgToDisplay, fmtWeight, fmtValue, fmtVolume, fmtSet, relativeDay,
} from '../calc';
import { metricLabel } from './ExercisePicker';

/* Per-exercise progress: trend chart + session-by-session deltas.
   Answers "am I improving on this lift?" at a glance. */
export default function ExerciseProgress({ ui, state, exerciseId, onClose }) {
  const { s, t } = ui;
  const unit = state.settings.unit;
  const ex = exerciseById(state, exerciseId);
  const sessions = useMemo(() => exerciseSessions(state.workouts, exerciseId), [state.workouts, exerciseId]);
  const latest = sessions[sessions.length - 1];
  const strength = latest && latest.metric === 'reps' && latest.weighted;

  const MEASURES = strength
    ? [['top', 'Top set'], ['e1rm', 'Est. 1RM'], ['vol', 'Volume']]
    : [['top', latest && latest.metric === 'time' ? 'Best hold' : latest && latest.metric === 'distance' ? 'Farthest' : 'Most reps']];
  const [measure, setMeasure] = useState('top');

  const valueOf = (sess) => {
    if (measure === 'e1rm') return sess.e1rm || 0;
    if (measure === 'vol') return sess.volume || 0;
    return strength ? sess.top.w : sess.top.v; // top set weight, or the metric value
  };
  const fmtMeasure = (sess) => {
    if (measure === 'e1rm') return fmtWeight(sess.e1rm || 0, unit);
    if (measure === 'vol') return fmtVolume(sess.volume || 0, unit);
    if (strength) return `${fmtWeight(sess.top.w, unit)} × ${sess.top.v}`;
    return fmtValue(sess.metric, sess.top.v);
  };
  const fmtDelta = (d) => {
    if (measure === 'vol') return `${d >= 0 ? '+' : '−'}${Math.round(Math.abs(kgToDisplay(d, unit))).toLocaleString()} ${unit}`;
    if (strength || measure === 'e1rm') {
      const v = Math.abs(kgToDisplay(d, unit));
      return `${d >= 0 ? '+' : '−'}${Math.round(v * 100) / 100} ${unit}`;
    }
    return `${d >= 0 ? '+' : '−'}${fmtValue(latest.metric, Math.abs(d))}`;
  };

  const chartSessions = sessions.slice(-8);
  const vals = chartSessions.map(valueOf);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const barH = (v) => (max === min ? 80 : 25 + 75 * ((v - min) / (max - min)));

  const newest = [...sessions].reverse();

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.overlayScreen}>
          <BackButton s={s} t={t} onPress={onClose} />
          <Text style={s.eyebrow}>PROGRESS</Text>
          <Text style={[s.h1, { marginBottom: 4 }]}>{ex ? ex.name : 'Exercise'}</Text>
          {ex && <Text style={[s.muted, { marginBottom: 14 }]}>{ex.group} · {metricLabel(ex.metric)}{ex.weighted ? '' : ' · Bodyweight'}</Text>}

          {sessions.length === 0 ? (
            <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 14 }]}>No logged sets for this exercise yet.</Text></View>
          ) : (
            <>
              {MEASURES.length > 1 && (
                <View style={[s.chipsWrap, { marginBottom: 12 }]}>
                  {MEASURES.map(([k, label]) => (
                    <Pressable key={k} onPress={() => setMeasure(k)} style={[s.chip, measure === k && { backgroundColor: t.accent, borderColor: t.accent }]}>
                      <Text style={[s.chipTxt, measure === k && { color: t.onAccent }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={s.card}>
                <View style={[s.chart, { height: 110 }]}>
                  {chartSessions.map((sess, i) => (
                    <View key={i} style={s.barCol}>
                      <View style={[s.bar, { height: `${barH(vals[i])}%` }, i === chartSessions.length - 1 && { backgroundColor: t.accent }]} />
                      <Text style={s.barLabel}>{new Date(sess.when).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}</Text>
                    </View>
                  ))}
                </View>
                <View style={[s.rowBetween, { marginTop: 8 }]}>
                  <Text style={[s.muted, s.monoTxt]}>{fmtMeasure(chartSessions[0])}</Text>
                  <Text style={[s.muted, s.monoTxt]}>Now · {fmtMeasure(chartSessions[chartSessions.length - 1])}</Text>
                </View>
                {measure === 'e1rm' && (
                  <Text style={[s.muted, { marginTop: 10, lineHeight: 17, fontSize: 12 }]}>
                    Est. 1RM is a projected one-rep max from weight × reps (Epley) — not a weight you lifted.
                  </Text>
                )}
              </View>

              <SecHead s={s} right={`${sessions.length} sessions`}>SESSION BY SESSION</SecHead>
              {newest.map((sess, i) => {
                const prev = newest[i + 1];
                const d = prev ? valueOf(sess) - valueOf(prev) : null;
                return (
                  <View key={sess.workoutId} style={[s.card, s.listRow, { paddingVertical: 12 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowTitle}>{fmtSet(sess.metric, sess.weighted, sess.top.w, sess.top.v, unit)}</Text>
                      <Text style={s.rowSub}>
                        {relativeDay(sess.when)} · {sess.sets} sets
                        {d !== null && (
                          <Text style={{ color: d >= 0 ? t.accent : t.danger, fontWeight: '700' }}>  {fmtDelta(d)}</Text>
                        )}
                      </Text>
                    </View>
                    <Text style={[s.rowEnd, { color: t.accent }]}>{fmtMeasure(sess)}</Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
