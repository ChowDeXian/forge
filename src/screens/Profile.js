import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, Share } from 'react-native';
import { SecHead, SettingRow, Toggle } from '../components';
import { totalVolume, fmtVolume } from '../calc';
import { mergeSaved } from '../store';
import { version as APP_VERSION } from '../../package.json';

const REST_OPTIONS = [60, 90, 120, 180];

export default function ProfileScreen({ ui, state, dispatch }) {
  const { s, t, toast } = ui;
  const { settings } = state;
  const setSetting = (key, value) => dispatch({ type: 'setSetting', key, value });
  const canInstall = Platform.OS === 'web' && typeof navigator !== 'undefined'
    && !(navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  const initials = (settings.name.trim() || 'You').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  const exportData = async () => {
    const { activeSession, ...data } = state;
    const json = JSON.stringify(data, null, 2);
    const fname = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Backup downloaded');
    } else {
      try { await Share.share({ message: json, title: fname }); } catch (e) {}
    }
  };

  const importData = () => {
    if (Platform.OS !== 'web') { toast('Import via the web app'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          dispatch({ type: 'importState', state: mergeSaved(parsed) });
          toast('Backup restored');
        } catch (e) {
          toast('That file is not a valid backup');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.eyebrow}>YOU</Text>
      <Text style={[s.h1, { marginBottom: 14 }]}>Profile</Text>

      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <View style={[s.avatar, { width: 56, height: 56 }]}><Text style={s.avatarTxt}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <TextInput
            value={settings.name}
            onChangeText={(v) => setSetting('name', v)}
            placeholder="Your name"
            placeholderTextColor={t.muted}
            style={[s.h2, { paddingVertical: 2 }]}
          />
          <Text style={[s.muted, { marginTop: 3 }]}>Personal build · just for you</Text>
        </View>
      </View>

      <View style={s.statGrid}>
        <View style={s.stat}><Text style={s.statL}>Total volume</Text><Text style={[s.statV, { fontSize: 19 }]}>{fmtVolume(totalVolume(state.workouts), settings.unit)}</Text></View>
        <View style={s.stat}><Text style={s.statL}>Workouts</Text><Text style={s.statV}>{state.workouts.length}</Text></View>
      </View>

      <SecHead s={s}>PREFERENCES</SecHead>
      <View style={s.card}>
        <SettingRow s={s} icon="⚖️" label="Units">
          <View style={s.seg}>
            {['kg', 'lbs'].map((u) => (
              <Pressable key={u} onPress={() => { setSetting('unit', u); toast('Units: ' + u); }} style={[s.segBtn, settings.unit === u && { backgroundColor: t.accent }]}>
                <Text style={[s.segTxt, settings.unit === u && { color: t.onAccent }]}>{u}</Text>
              </Pressable>
            ))}
          </View>
        </SettingRow>
        <SettingRow s={s} icon="🌗" label="Light mode">
          <Toggle s={s} t={t} on={!settings.dark} onPress={() => setSetting('dark', !settings.dark)} />
        </SettingRow>
        <SettingRow s={s} icon="⏱️" label="Default rest timer" last>
          <View style={s.seg}>
            {REST_OPTIONS.map((sec) => (
              <Pressable key={sec} onPress={() => setSetting('restDefault', sec)} style={[s.segBtn, { paddingHorizontal: 9 }, settings.restDefault === sec && { backgroundColor: t.accent }]}>
                <Text style={[s.segTxt, { fontSize: 12 }, settings.restDefault === sec && { color: t.onAccent }]}>{sec}s</Text>
              </Pressable>
            ))}
          </View>
        </SettingRow>
      </View>

      {canInstall && (
        <>
          <SecHead s={s}>APP</SecHead>
          <Pressable style={s.btnPrimary} onPress={ui.openInstall}><Text style={s.btnPrimaryTxt}>Install to home screen</Text></Pressable>
          <Text style={[s.muted, { marginTop: 10, lineHeight: 18 }]}>Runs fullscreen with no Safari bars, and fully offline. Recommended.</Text>
        </>
      )}

      <SecHead s={s}>DATA</SecHead>
      <Pressable style={s.btnGhost} onPress={exportData}><Text style={s.btnGhostTxt}>Export backup (JSON)</Text></Pressable>
      <Pressable style={[s.btnGhost, { marginTop: 10 }]} onPress={importData}><Text style={s.btnGhostTxt}>Restore from backup</Text></Pressable>
      <Text style={[s.muted, { marginTop: 12, lineHeight: 18 }]}>
        All data lives on this device. Export a backup now and then — especially before clearing Safari website data.
      </Text>
      <Text style={[s.muted, s.monoTxt, { textAlign: 'center', marginTop: 18 }]}>FORGE v{APP_VERSION}</Text>
    </ScrollView>
  );
}
