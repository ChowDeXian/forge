import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, SafeAreaView } from 'react-native';

export const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

/* Full-screen exercise picker with search + muscle-group filter.
   props: ui {s,t}, exercises, title, onPick(exercise), onClose, onCreateNew? */
export default function ExercisePicker({ ui, exercises, title = 'Add Exercise', onPick, onClose, onCreateNew }) {
  const { s, t } = ui;
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises
      .filter((e) => (group === 'All' || e.group === group) && (!needle || e.name.toLowerCase().includes(needle)))
      .sort((a, b) => (a.builtin === b.builtin ? a.name.localeCompare(b.name) : a.builtin ? 1 : -1));
  }, [exercises, q, group]);

  return (
    <View style={s.overlay}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onClose}><Text style={s.back}>‹ Back</Text></Pressable>
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
            <View style={s.card}><Text style={[s.muted, { textAlign: 'center', paddingVertical: 12 }]}>No exercises match.</Text></View>
          )}
          {list.map((x) => (
            <Pressable key={x.id} style={[s.card, s.listRow, { paddingVertical: 12 }]} onPress={() => onPick(x)}>
              <View style={s.ic}><Text style={{ fontSize: 18 }}>{x.hasVideo ? '🎬' : x.builtin ? '🏋️' : '⭐'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{x.name}</Text>
                <Text style={s.rowSub}>{x.group} · {x.equipment}</Text>
              </View>
              <Text style={[s.muted, { fontSize: 18 }]}>＋</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
