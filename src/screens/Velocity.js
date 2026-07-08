import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* FORGE Velocity (bar-speed video analysis) — the vbt sub-app built into dist/vbt/,
   embedded same-origin so its IndexedDB history and the shared service worker just work.
   Web only: the analysis stack (canvas, requestVideoFrameCallback, MediaRecorder) has no native counterpart here. */
export default function VelocityScreen({ ui }) {
  const { s, t } = ui;
  const insets = useSafeAreaInsets(); // env() is 0 inside iframes — the host must clear the Dynamic Island
  const [available, setAvailable] = useState(null); // null = checking, false = not in this build (dev server)

  useEffect(() => {
    if (Platform.OS !== 'web') { setAvailable(false); return; }
    let cancelled = false;
    fetch('vbt/index.html')
      .then((r) => (r.ok ? r.text() : ''))
      .then((html) => { if (!cancelled) setAvailable(html.includes('Velocity')); })
      .catch(() => { if (!cancelled) setAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  if (available === null) return <View style={{ flex: 1 }} />;

  if (!available) {
    return (
      <View style={[s.screen, { flex: 1 }]}>
        <Text style={s.eyebrow}>BAR SPEED</Text>
        <Text style={[s.h1, { marginBottom: 14 }]}>Velocity</Text>
        <View style={s.card}>
          <Text style={[s.h2, { marginBottom: 6 }]}>Not available in dev mode</Text>
          <Text style={[s.muted, { lineHeight: 19 }]}>
            The Velocity analyzer is bundled by `npm run build` and served from the deployed app.
            For Velocity development, run the vbt/ project's own dev server instead.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', paddingTop: insets.top }}>
      <iframe
        src="vbt/index.html"
        title="FORGE Velocity"
        allow="camera; autoplay"
        style={{ flex: '1 1 auto', width: '100%', height: '100%', border: 0, backgroundColor: '#0D0D0D' }}
      />
    </View>
  );
}
