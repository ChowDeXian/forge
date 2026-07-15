import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { Share as ShareIcon, Plus, Check } from 'lucide-react-native';

const DISMISS_KEY = 'forge.install.dismissed';

const isStandalone = () =>
  (typeof navigator !== 'undefined' && navigator.standalone === true) ||
  (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent || '');

/* Bottom-sheet guide to install FORGE to the home screen — the only way to a
   truly toolbar-free fullscreen app on iOS. Auto-shows once in iOS Safari
   (not standalone, not previously dismissed); also opened from Profile. */
export default function InstallPrompt({ ui, open, onClose }) {
  const { s, t } = ui;
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) {}
    if (isIOS() && !isStandalone() && !dismissed) setAuto(true);
  }, []);

  const visible = open || auto;
  if (!visible) return null;

  const close = (remember) => {
    if (remember) { try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {} }
    setAuto(false);
    onClose && onClose();
  };

  const Step = ({ n, icon, children }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
      <View style={s.installStep}>{icon}</View>
      <Text style={[s.rowTitle, { flex: 1 }]}>
        <Text style={{ color: t.accent, fontWeight: '800' }}>{n}. </Text>
        {children}
      </Text>
    </View>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => close(false)}>
      <View style={s.modalBg}>
        <View style={s.modal}>
          <View style={s.grab} />
          <Text style={s.h1}>Install FORGE</Text>
          <Text style={[s.muted, { marginTop: 6, lineHeight: 20 }]}>
            Add it to your home screen for a clean, fullscreen app — no Safari bars, and it works fully offline.
          </Text>

          <Step n="1" icon={<ShareIcon size={18} color={t.accent} strokeWidth={2.2} />}>
            Tap the <Text style={{ fontWeight: '700', color: t.text }}>Share</Text> button in Safari's bar
          </Step>
          <Step n="2" icon={<Plus size={18} color={t.accent} strokeWidth={2.2} />}>
            Choose <Text style={{ fontWeight: '700', color: t.text }}>Add to Home Screen</Text>
          </Step>
          <Step n="3" icon={<Check size={18} color={t.accent} strokeWidth={2.2} />}>
            Open FORGE from your home screen
          </Step>

          <Pressable style={[s.btnPrimary, { marginTop: 20 }]} onPress={() => close(true)}>
            <Text style={s.btnPrimaryTxt}>Got it</Text>
          </Pressable>
          <Pressable onPress={() => close(false)} hitSlop={8}>
            <Text style={[s.muted, { textAlign: 'center', marginTop: 12 }]}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
