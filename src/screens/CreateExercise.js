import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { exerciseById } from '../store';
import { uid } from '../calc';
import { saveVideo, getVideoUri, deleteVideo } from '../videoStore';
import { GROUPS } from './ExercisePicker';

/* Create a new exercise, or edit an existing one (exerciseId set). */
export default function CreateExercise({ ui, state, dispatch, exerciseId, onClose }) {
  const { s, t, toast, confirm } = ui;
  const existing = exerciseId ? exerciseById(state, exerciseId) : null;

  const [name, setName] = useState(existing ? existing.name : '');
  const [group, setGroup] = useState(existing ? existing.group : 'Chest');
  const [equip, setEquip] = useState(existing ? existing.equipment : '');
  const [notes, setNotes] = useState(existing ? existing.notes : '');
  const [videoUri, setVideoUri] = useState(null);
  const [videoChanged, setVideoChanged] = useState(false);

  const previewPlayer = useVideoPlayer(null);
  useEffect(() => {
    try { previewPlayer.replace(videoUri ? { uri: videoUri } : null); } catch (e) {}
  }, [videoUri]);

  // load the stored demo video when editing
  useEffect(() => {
    if (existing && existing.hasVideo) getVideoUri(existing.id).then((uri) => { if (uri) setVideoUri(uri); });
  }, []);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast('Allow media access to attach a demo'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (!res.canceled && res.assets && res.assets[0]) { setVideoUri(res.assets[0].uri); setVideoChanged(true); }
  };

  const save = async () => {
    if (!name.trim()) { toast('Add a name first'); return; }
    const id = existing ? existing.id : uid();
    const hasVideo = !!videoUri;
    try {
      if (videoChanged) {
        if (videoUri) await saveVideo(id, videoUri);
        else await deleteVideo(id);
      }
    } catch (e) {
      toast('Video could not be saved');
    }
    const patch = { name: name.trim(), group, equipment: equip.trim() || 'Custom', notes: notes.trim(), hasVideo };
    if (existing) dispatch({ type: 'updateExercise', id, patch });
    else dispatch({ type: 'addExercise', exercise: { id, ...patch, builtin: false } });
    toast('Saved ' + patch.name);
    onClose();
  };

  const del = () =>
    confirm({
      title: `Delete ${existing.name}?`,
      message: 'It is removed from your library and routines. Logged workouts in History keep their data.',
      actions: [{ label: 'Cancel' }, {
        label: 'Delete exercise', danger: true,
        onPress: () => { deleteVideo(existing.id).catch(() => {}); dispatch({ type: 'deleteExercise', id: existing.id }); toast('Exercise deleted'); onClose(); },
      }],
    });

  return (
    <View style={s.overlay}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.overlayScreen} keyboardShouldPersistTaps="handled">
          <Pressable onPress={onClose}><Text style={s.back}>‹ Back</Text></Pressable>
          <Text style={s.h1}>{existing ? 'Edit Exercise' : 'New Exercise'}</Text>
          <Text style={[s.muted, { marginBottom: 18 }]}>{existing ? (existing.builtin ? 'Built-in exercise — add notes or a demo video' : 'Update your custom movement') : 'Add a custom movement to your library'}</Text>

          <Text style={s.fieldLabel}>EXERCISE NAME</Text>
          <View style={s.field}><TextInput value={name} onChangeText={setName} placeholder="e.g. Spoto Press" placeholderTextColor={t.muted} style={s.input} /></View>

          <Text style={s.fieldLabel}>MUSCLE GROUP</Text>
          <View style={s.chipsWrap}>
            {GROUPS.map((g) => (
              <Pressable key={g} onPress={() => setGroup(g)} style={[s.chip, group === g && { backgroundColor: t.accent, borderColor: t.accent }]}>
                <Text style={[s.chipTxt, group === g && { color: t.onAccent }]}>{g}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.fieldLabel}>EQUIPMENT</Text>
          <View style={s.field}><TextInput value={equip} onChangeText={setEquip} placeholder="e.g. Barbell" placeholderTextColor={t.muted} style={s.input} /></View>

          <Text style={s.fieldLabel}>EXAMPLE VIDEO</Text>
          <Pressable style={s.uploader} onPress={videoUri ? undefined : pickVideo}>
            {!videoUri ? (
              <View style={{ alignItems: 'center', paddingVertical: 22 }}>
                <Text style={{ fontSize: 26, marginBottom: 6 }}>⬆️</Text>
                <Text style={{ color: t.accent, fontWeight: '700' }}>Upload a demo video</Text>
                <Text style={[s.muted, { fontSize: 12, marginTop: 4 }]}>Pick from your library · tap to choose</Text>
              </View>
            ) : (
              <View>
                <VideoView player={previewPlayer} style={s.videoBox} contentFit="contain" nativeControls />
                <Pressable style={s.upReplace} onPress={() => { setVideoUri(null); setVideoChanged(true); }}>
                  <Text style={{ color: t.danger, fontWeight: '600' }}>Remove video</Text>
                </Pressable>
              </View>
            )}
          </Pressable>

          <Text style={s.fieldLabel}>NOTES (OPTIONAL)</Text>
          <View style={s.field}><TextInput value={notes} onChangeText={setNotes} placeholder="Cues, setup, tempo…" placeholderTextColor={t.muted} style={[s.input, { height: 70 }]} multiline /></View>

          <Pressable style={[s.btnPrimary, { marginTop: 8 }]} onPress={save}><Text style={s.btnPrimaryTxt}>Save Exercise</Text></Pressable>
          {existing && !existing.builtin && (
            <Pressable style={[s.btnDanger, { marginTop: 10 }]} onPress={del}><Text style={s.btnDangerTxt}>Delete Exercise</Text></Pressable>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
