import { StyleSheet } from 'react-native';
import { MONO } from './theme';

/* insets = device safe areas (Dynamic Island / home indicator); surfaces run
   edge-to-edge and each padded region adds the inset it touches. */
export function makeStyles(t, insets = { top: 0, bottom: 0, left: 0, right: 0 }) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    screen: { padding: 20, paddingTop: 20 + insets.top, paddingBottom: 40 },
    overlayScreen: { padding: 20, paddingTop: 20 + insets.top, paddingBottom: 60 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    eyebrow: { fontSize: 12, fontWeight: '700', color: t.muted, letterSpacing: 1.4 },
    h1: { fontSize: 27, fontWeight: '800', color: t.text, letterSpacing: -0.5, marginTop: 4 },
    h2: { fontSize: 18, fontWeight: '700', color: t.text },
    muted: { color: t.muted, fontSize: 13 },
    monoTxt: { fontFamily: MONO, fontSize: 12 },

    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { color: t.text, fontWeight: '700' },

    streak: { alignSelf: 'flex-start', backgroundColor: t.accentDim, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, marginTop: 12 },
    streakTxt: { color: t.accent, fontWeight: '700', fontSize: 13 },

    card: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 20, padding: 18, marginBottom: 12 },
    hero: { borderColor: t.accent + '55', shadowColor: t.accent, shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },

    pillRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    pill: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },
    pillTxt: { color: t.muted, fontSize: 12, fontWeight: '600' },
    play: { position: 'absolute', right: 18, bottom: 18, width: 50, height: 50, borderRadius: 25, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },

    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 9 },
    barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
    bar: { width: '70%', maxWidth: 26, borderRadius: 7, backgroundColor: t.surface3 },
    barLabel: { fontSize: 11, color: t.muted, fontWeight: '600', marginTop: 8 },

    btnPrimary: { backgroundColor: t.accent, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
    btnPrimaryTxt: { color: t.onAccent, fontWeight: '800', fontSize: 15.5, letterSpacing: 0.2 },
    btnGhost: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line, borderRadius: 14, padding: 16, alignItems: 'center' },
    btnGhostTxt: { color: t.text, fontWeight: '700', fontSize: 15.5 },
    btnDanger: { backgroundColor: t.surface2, borderWidth: 1, borderColor: t.danger + '55', borderRadius: 14, padding: 16, alignItems: 'center' },
    btnDangerTxt: { color: t.danger, fontWeight: '700', fontSize: 15.5 },

    listRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14 },
    ic: { width: 42, height: 42, borderRadius: 11, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { color: t.text, fontWeight: '600', fontSize: 14.5 },
    rowSub: { color: t.muted, fontSize: 12.5, marginTop: 2 },
    rowEnd: { fontFamily: MONO, color: t.muted, fontWeight: '700', fontSize: 13 },

    // nav sits lower on the screen: extra 20px below the labels clears the Safari bookmark bar
    // floating pill nav: detached bar with a lime pill behind the active tab
    nav: {
      flexDirection: 'row', gap: 4,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 24,
      marginHorizontal: 14, marginTop: 6, marginBottom: insets.bottom + 8,
      paddingVertical: 7, paddingHorizontal: 7,
      shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 7, borderRadius: 16 },
    navItemActive: { backgroundColor: t.accent },
    navLabel: { fontSize: 10, fontWeight: '700', color: t.muted, letterSpacing: 0.2 },

    /* resume bar (active session minimised) */
    resumeBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.accent, paddingVertical: 12, paddingHorizontal: 18 },
    resumeTxt: { flex: 1, color: t.onAccent, fontWeight: '700', fontSize: 14 },
    resumeTimer: { fontFamily: MONO, color: t.onAccent, fontWeight: '700', fontSize: 14 },

    /* logger */
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: t.bg },
    loggerHead: { paddingHorizontal: 20, paddingTop: 10 + insets.top, paddingBottom: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 10 },
    back: { color: t.text, fontWeight: '600', fontSize: 15 },
    bigTimer: { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: t.text },
    restPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: t.accentDim, borderWidth: 1, borderColor: t.accent + '55', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, marginTop: 12 },
    restText: { color: t.accent, fontWeight: '700', fontSize: 13 },
    restBarTrack: { flex: 1, height: 4, backgroundColor: t.accent + '33', borderRadius: 2, overflow: 'hidden' },
    restBarFill: { height: '100%', backgroundColor: t.accent },

    exName: { fontSize: 16.5, fontWeight: '700', color: t.text, marginBottom: 4 },
    setHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
    setHeadTxt: { fontSize: 10.5, color: t.muted, fontWeight: '700', letterSpacing: 0.5 },
    setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
    setNo: { width: 34, height: 30, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
    setNoTxt: { fontFamily: MONO, fontWeight: '700', fontSize: 13, color: t.muted },
    /* draggable value meter (slide to adjust, tap to type) */
    meter: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface2, borderRadius: 10, borderWidth: 1, borderColor: t.line, height: 44, paddingHorizontal: 6 },
    meterVal: { flex: 1, textAlign: 'center', fontFamily: MONO, fontWeight: '700', fontSize: 16, color: t.text },
    meterHint: { color: t.muted, fontSize: 14, fontWeight: '700', paddingHorizontal: 3 },
    supersetCard: { borderLeftWidth: 3, borderLeftColor: t.accent },
    supersetTag: { color: t.accent, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
    check: { width: 42, height: 42, borderRadius: 11, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
    addSet: { marginTop: 6, padding: 11, borderRadius: 11, borderWidth: 1, borderColor: t.line, borderStyle: 'dashed', alignItems: 'center' },
    addSetTxt: { color: t.muted, fontWeight: '600', fontSize: 13.5 },
    finishBar: { padding: 16, paddingBottom: 22 + insets.bottom, gap: 10 },
    iconBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' },
    iconBtnTxt: { color: t.muted, fontWeight: '700', fontSize: 14 },

    /* form */
    fieldLabel: { fontSize: 12, fontWeight: '700', color: t.muted, letterSpacing: 0.8, marginBottom: 8, marginTop: 2 },
    field: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 4, marginBottom: 18 },
    input: { color: t.text, fontSize: 16, paddingVertical: 10 }, // ≥16px or iOS zooms the viewport on focus
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
    chip: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
    chipTxt: { color: t.muted, fontSize: 13, fontWeight: '600' },
    uploader: { backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.line, borderStyle: 'dashed', borderRadius: 14, padding: 14, marginBottom: 18 },
    videoBox: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#000' },
    upReplace: { marginTop: 10, padding: 9, borderRadius: 10, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface2, alignItems: 'center' },

    /* schedule */
    dayBox: { width: 84, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface, padding: 12, alignItems: 'center' },
    dayD: { fontSize: 11, color: t.muted, fontWeight: '700' },
    dayW: { fontSize: 12.5, color: t.text, fontWeight: '600', marginTop: 8, textAlign: 'center' },

    /* history */
    statGrid: { flexDirection: 'row', gap: 12, marginBottom: 4 },
    stat: { flex: 1, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 12, padding: 15 },
    statL: { fontSize: 11.5, color: t.muted, fontWeight: '600' },
    statV: { fontFamily: MONO, fontSize: 23, fontWeight: '700', color: t.text, marginTop: 6 },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calDow: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, color: t.muted, fontWeight: '600', marginBottom: 6 },
    calCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
    calTxt: { fontFamily: MONO, fontSize: 12, fontWeight: '600', color: t.muted },
    calNavBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' },

    /* settings */
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: t.line },
    settingIc: { width: 38, height: 38, borderRadius: 10, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { flex: 1, color: t.text, fontWeight: '600', fontSize: 14.5 },
    seg: { flexDirection: 'row', backgroundColor: t.surface2, borderRadius: 9, padding: 3 },
    segBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 7 },
    segTxt: { fontFamily: MONO, fontWeight: '700', fontSize: 13, color: t.muted },
    toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: t.surface3, justifyContent: 'center' },
    knob: { position: 'absolute', left: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },

    /* modal + toast + confirm */
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modal: { backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 + insets.bottom },
    grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: t.surface3, alignSelf: 'center', marginBottom: 18 },
    toast: { position: 'absolute', bottom: 100 + insets.bottom, alignSelf: 'center', backgroundColor: t.accent, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 13 },
    toastTxt: { color: t.onAccent, fontWeight: '700', fontSize: 13.5 },
    confirmBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28 },
    confirmCard: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: 20, padding: 22, width: '100%', maxWidth: 420 },
    installStep: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.accentDim, alignItems: 'center', justifyContent: 'center' },
  });
}
