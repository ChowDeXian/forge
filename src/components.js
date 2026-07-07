import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';

/* Stepper with tap-to-type: tap the value to enter an exact number. */
export function Stepper({ s, t, display, raw, unit, decimal, onMinus, onPlus, onCommit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commit = () => {
    setEditing(false);
    const v = parseFloat(String(draft).replace(',', '.'));
    if (!Number.isNaN(v) && v >= 0) onCommit(v);
  };

  return (
    <View style={s.stepper}>
      <Pressable style={s.stepBtn} onPress={onMinus}><Text style={s.stepSign}>−</Text></Pressable>
      {editing ? (
        <TextInput
          style={[s.stepVal, { paddingVertical: 0 }]}
          value={draft}
          onChangeText={setDraft}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          inputMode={decimal ? 'decimal' : 'numeric'}
          autoFocus
          selectTextOnFocus
          onBlur={commit}
          onSubmitEditing={commit}
        />
      ) : (
        <Pressable style={{ flex: 1 }} onPress={() => { setDraft(String(raw)); setEditing(true); }}>
          <Text style={s.stepVal}>{display}{unit ? <Text style={s.stepUnit}> {unit}</Text> : null}</Text>
        </Pressable>
      )}
      <Pressable style={s.stepBtn} onPress={onPlus}><Text style={s.stepSign}>+</Text></Pressable>
    </View>
  );
}

export function Pill({ s, t, accent, children }) {
  return <View style={[s.pill, accent && { backgroundColor: t.accentDim }]}><Text style={[s.pillTxt, accent && { color: t.accent }]}>{children}</Text></View>;
}

export function SecHead({ s, children, right }) {
  return <View style={[s.rowBetween, { marginTop: 22, marginBottom: 10 }]}><Text style={s.eyebrow}>{children}</Text>{right ? <Text style={[s.muted, { fontSize: 12 }]}>{right}</Text> : null}</View>;
}

export function SettingRow({ s, icon, label, children, last }) {
  return (
    <View style={[s.settingRow, last && { borderBottomWidth: 0 }]}>
      <View style={s.settingIc}><Text style={{ fontSize: 16 }}>{icon}</Text></View>
      <Text style={s.settingLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Toggle({ s, t, on, onPress }) {
  return <Pressable onPress={onPress} style={[s.toggle, on && { backgroundColor: t.accent }]}><View style={[s.knob, on && { left: 23 }]} /></Pressable>;
}

/* Cross-platform confirm dialog (Alert.alert does nothing on web).
   config: { title, message, actions: [{ label, danger, primary, onPress }] } | null */
export function ConfirmModal({ s, t, config, onClose }) {
  if (!config) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.confirmBg}>
        <View style={s.confirmCard}>
          <Text style={s.h2}>{config.title}</Text>
          {config.message ? <Text style={[s.muted, { marginTop: 8, lineHeight: 19 }]}>{config.message}</Text> : null}
          <View style={{ marginTop: 18, gap: 9 }}>
            {config.actions.map((a, i) => (
              <Pressable
                key={i}
                style={[s.btnGhost, a.primary && s.btnPrimary, a.danger && { borderColor: t.danger + '66' }]}
                onPress={() => { onClose(); a.onPress && a.onPress(); }}
              >
                <Text style={[s.btnGhostTxt, a.primary && s.btnPrimaryTxt, a.danger && { color: t.danger }]}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
