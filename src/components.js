import React, { useRef, useState } from 'react';
import { View, Text, Pressable, TextInput, Modal, PanResponder } from 'react-native';

/* Draggable value meter: slide left/right to change (one step per ~18px),
   tap to type an exact value. `value` is in display units.
   parse(text) may return null to reject input (e.g. bad mm:ss). */
export function DragMeter({ s, t, value, step, min = 0, format, parse, onCommit }) {
  const [dragVal, setDragVal] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const valueRef = useRef(value);
  valueRef.current = value;
  const cfgRef = useRef({});
  cfgRef.current = { step, min, onCommit };
  const startRef = useRef(0);
  const dragRef = useRef(null);

  const pan = useRef(null);
  if (!pan.current) {
    pan.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderGrant: () => { startRef.current = valueRef.current; },
      onPanResponderMove: (_, g) => {
        const { step, min } = cfgRef.current;
        const raw = startRef.current + Math.round(g.dx / 18) * step;
        const snapped = Math.max(min, Math.round(raw / step) * step);
        const next = Math.round(snapped * 100) / 100;
        dragRef.current = next;
        setDragVal(next);
      },
      onPanResponderRelease: () => {
        if (dragRef.current !== null && dragRef.current !== valueRef.current) cfgRef.current.onCommit(dragRef.current);
        dragRef.current = null;
        setDragVal(null);
      },
      onPanResponderTerminate: () => { dragRef.current = null; setDragVal(null); },
    });
  }

  const commitDraft = () => {
    setEditing(false);
    const v = parse ? parse(draft) : parseFloat(String(draft).replace(',', '.'));
    if (v !== null && !Number.isNaN(v) && v >= min) onCommit(Math.round(v * 100) / 100);
  };

  const shown = dragVal !== null ? dragVal : value;
  const dragging = dragVal !== null;

  return (
    <View
      style={[s.meter, dragging && { borderColor: t.accent, backgroundColor: t.accentDim }, { touchAction: 'pan-y' }]}
      {...pan.current.panHandlers}
    >
      <Text style={s.meterHint}>‹</Text>
      {editing ? (
        <TextInput
          style={[s.meterVal, { paddingVertical: 0 }]}
          value={draft}
          onChangeText={setDraft}
          keyboardType="numbers-and-punctuation"
          inputMode="decimal"
          autoFocus
          selectTextOnFocus
          onBlur={commitDraft}
          onSubmitEditing={commitDraft}
        />
      ) : (
        <Pressable style={{ flex: 1 }} onPress={() => { setDraft(String(value)); setEditing(true); }}>
          <Text style={[s.meterVal, dragging && { color: t.accent }]}>{format ? format(shown) : shown}</Text>
        </Pressable>
      )}
      <Text style={s.meterHint}>›</Text>
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

/* Small chip row used for fixed choices (category, equipment, tracking). */
export function ChipRow({ s, t, options, value, onChange }) {
  return (
    <View style={s.chipsWrap}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[s.chip, value === o && { backgroundColor: t.accent, borderColor: t.accent }]}>
          <Text style={[s.chipTxt, value === o && { color: t.onAccent }]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
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
