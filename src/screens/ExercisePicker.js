import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { BackButton } from '../components';

export const GROUPS = ['Upper', 'Lower', 'Core', 'Isometrics', 'Plyometrics'];
export const EQUIPMENT = ['Dumbbell', 'Barbell', 'Machine', 'Body Weight'];
export const METRICS = [['reps', 'Reps'], ['time', 'Time'], ['distance', 'Distance']];

export const metricLabel = (metric) => (METRICS.find(([m]) => m === metric) || METRICS[0])[1];

/* Full-screen exercise picker with search + category filter.
   props: ui {s,t}, exercises, title, onPick(exercise), onClose, onCreateNew? */
export default function ExercisePicker({ ui, exercises, title = 'Add Exercise', onPick, onClose, onCreateNew }) {
  const { s, t } = ui;
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises
      .filter((e) => (group === 'All' || e.group === group) && (!needle || e.name.toLowerCase().includes(needle)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [exercises, q, group]);

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.overlayScreen} keyboardShouldPersistTaps="handled">
          <BackButton s={s} t={t} onPress={onClose} />
          <Text style={[s.h1, { marginBottom: 14 }]}>{title}</Text>

          <View style={[s.field, { marginBottom: 12 }]}>
            <TextInput value={q} onChangeText={setQ} placeholder="Search exercises…" placeholderTextColor={t.muted} style={s.input} />
          </View>

          <View style={[s.chipsWrap, { marginBottom: 12 }]}>
            {['All', ...GROUPS].map((g) => (
              <Pressable key={g} onPress={() => setGroup(g)} style={[s.chip, group === g && { backgroundColor: t.accent, borderColor: t.accent }]}>
                <Text style={[s.chipTxt, group === g && { color: t.onAccent }]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          {onCreateNew && (
            <Pressable style={[s.btnGhost, { marginBottom: 12 }]} onPress={onCreateNew}>
              <Text style={s.btnGhostTxt}>＋ Create new exercise</Text>
            </Pressable>
          )}

          {list.length === 0 && (
            <View style={s.card}>
              <Text style={[s.muted, { textAlign: 'center', paddingVertical: 12 }]}>
                {exercises.length === 0 ? 'Your library is empty — create your first exercise.' : 'No exercises match.'}
              </Text>
            </View>
          )}
          {list.map((x) => (
            <Pressable key={x.id} style={[s.card, s.listRow, { paddingVertical: 12 }]} onPress={() => onPick(x)}>
              <View style={s.ic}><Text style={{ fontSize: 18 }}>{x.hasVideo ? '🎬' : '🏋️'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{x.name}</Text>
                <Text style={s.rowSub}>{x.group} · {x.equipment} · {metricLabel(x.metric)}{x.weighted ? '' : ' · BW'}</Text>
              </View>
              <Text style={[s.muted, { fontSize: 18 }]}>＋</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
