/* Pure helpers: units, 1RM, volume, streaks, PRs. Weights are stored in kg.
   Entries carry a snapshot of how the exercise is tracked:
   metric 'reps' | 'time' (seconds) | 'distance' (meters), weighted bool.
   Sets are { w, v, done } — v is the metric value. */

const KG_PER_LB = 0.45359237;

export const kgToDisplay = (kg, unit) => (unit === 'lbs' ? kg / KG_PER_LB : kg);
export const displayToKg = (v, unit) => (unit === 'lbs' ? v * KG_PER_LB : v);

/** Round a display weight to a sensible precision for its unit. */
export const roundDisplay = (v, unit) => (unit === 'lbs' ? Math.round(v * 2) / 2 : Math.round(v * 100) / 100);

export const fmtWeight = (kg, unit) => {
  const v = roundDisplay(kgToDisplay(kg, unit), unit);
  const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  return `${s} ${unit}`;
};

/** Drag-meter increment expressed in kg for the active unit (2.5 kg / 5 lb). */
export const weightStepKg = (unit) => (unit === 'lbs' ? 5 * KG_PER_LB : 2.5);

/** Drag-meter increment for the metric value column. */
export const valueStep = (metric) => (metric === 'reps' ? 1 : 5);

export const fmtDuration = (sec) => {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const fmtDurationShort = (sec) => {
  const m = Math.round(sec / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

/** Metric value for display: reps "8", time "45s"/"1:30", distance "100 m". */
export const fmtValue = (metric, v) => {
  if (metric === 'time') return v < 60 ? `${v}s` : `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`;
  if (metric === 'distance') return `${v} m`;
  return String(v);
};

/** Whole logged set for display, e.g. "80 kg × 8", "45s", "20 kg × 1:00", "100 m". */
export const fmtSet = (metric, weighted, w, v, unit) => {
  const val = metric === 'reps' && !weighted ? `${v} reps` : fmtValue(metric, v);
  return weighted ? `${fmtWeight(w, unit)} × ${fmtValue(metric, v)}` : val;
};

/** Parse a typed metric value; time accepts "90", "90s" or "1:30". Returns null if invalid. */
export const parseValueInput = (metric, text) => {
  const raw = String(text).trim().toLowerCase().replace(',', '.');
  if (metric === 'time' && raw.includes(':')) {
    const [m, sec] = raw.split(':');
    const mm = parseInt(m, 10), ss = parseFloat(sec);
    if (Number.isNaN(mm) || Number.isNaN(ss)) return null;
    return mm * 60 + ss;
  }
  const v = parseFloat(raw.replace(/[a-z ]+$/, ''));
  return Number.isNaN(v) ? null : v;
};

/** Sensible starting set when there's no history for an exercise. */
export const defaultSet = (exercise) => ({
  w: exercise.weighted ? 20 : 0,
  v: exercise.metric === 'time' ? 30 : exercise.metric === 'distance' ? 100 : 10,
});

/** Epley estimated 1RM (weighted reps only). */
export const epley = (w, r) => (r <= 1 ? w : w * (1 + r / 30));

/** 'YYYY-MM-DD' key in local time. */
export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const entryMetric = (e) => e.metric || 'reps';
const entryWeighted = (e) => (e.weighted !== undefined ? e.weighted : true);

/** Tonnage: weight × reps over done sets of weighted rep-tracked entries. */
export const workoutVolume = (workout) =>
  workout.entries.reduce((a, e) => {
    if (entryMetric(e) !== 'reps' || !entryWeighted(e)) return a;
    return a + e.sets.filter((s) => s.done).reduce((b, s) => b + s.w * s.v, 0);
  }, 0);

export const fmtVolume = (kg, unit) => {
  const v = kgToDisplay(kg, unit);
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} M ${unit}`;
  return `${Math.round(v).toLocaleString()} ${unit}`;
};

const DAY_MS = 86400000;

/** Longest run of consecutive calendar days with >=1 workout. */
export function longestStreak(workouts) {
  const days = [...new Set(workouts.map((w) => dayKey(w.startedAt)))].sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    const t = new Date(k + 'T12:00:00').getTime();
    run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

/** Current streak of consecutive days ending today or yesterday. */
export function currentStreak(workouts, now = Date.now()) {
  const days = new Set(workouts.map((w) => dayKey(w.startedAt)));
  let t = now;
  if (!days.has(dayKey(t))) t -= DAY_MS; // a rest day today doesn't break the streak yet
  let n = 0;
  while (days.has(dayKey(t))) { n += 1; t -= DAY_MS; }
  return n;
}

/** Volume per day for the current week, Monday-first: [{key, volume}] x7. */
export function weeklyVolume(workouts, now = Date.now()) {
  const d = new Date(now);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const byDay = {};
  for (const w of workouts) byDay[dayKey(w.startedAt)] = (byDay[dayKey(w.startedAt)] || 0) + workoutVolume(w);
  return Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(monday.getTime() + i * DAY_MS);
    return { key: k, volume: byDay[k] || 0 };
  });
}

export const bestSetOf = (entry) => {
  const done = entry.sets.filter((s) => s.done && s.v > 0);
  if (!done.length) return null;
  if (entryMetric(entry) === 'reps' && entryWeighted(entry)) {
    return done.reduce((a, s) => (epley(s.w, s.v) > epley(a.w, a.v) ? s : a));
  }
  return done.reduce((a, s) => (s.v > a.v ? s : a));
};

/** Most recent done performance of an exercise: { metric, weighted, w, v, when } or null. */
export function lastPerformance(workouts, exerciseId) {
  const sorted = [...workouts].sort((a, b) => b.startedAt - a.startedAt);
  for (const w of sorted) {
    const entry = w.entries.find((e) => e.exerciseId === exerciseId);
    if (!entry) continue;
    const best = bestSetOf(entry);
    if (best) return { metric: entryMetric(entry), weighted: entryWeighted(entry), w: best.w, v: best.v, when: w.startedAt };
  }
  return null;
}

/** Per-workout best est. 1RM series (weighted reps entries only), oldest first. */
export function oneRmSeries(workouts, exerciseId) {
  return [...workouts]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((w) => {
      const entry = w.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry || entryMetric(entry) !== 'reps' || !entryWeighted(entry)) return null;
      const done = entry.sets.filter((s) => s.done && s.w > 0 && s.v > 0);
      if (!done.length) return null;
      return { when: w.startedAt, oneRm: Math.max(...done.map((s) => epley(s.w, s.v))) };
    })
    .filter(Boolean);
}

/** Exercise ids that appear in history, most-trained first. Optional metric filter. */
export function trainedExerciseIds(workouts, metric) {
  const count = {};
  for (const w of workouts) {
    for (const e of w.entries) {
      if (metric && entryMetric(e) !== metric) continue;
      if (metric === 'reps' && !entryWeighted(e)) continue; // 1RM chart needs weight
      if (e.sets.some((s) => s.done)) count[e.exerciseId] = (count[e.exerciseId] || 0) + 1;
    }
  }
  return Object.keys(count).sort((a, b) => count[b] - count[a]);
}

/** PRs per exercise, typed by metric:
    reps+weighted → { bestOneRm: {w,v,val}, heaviest: {w,v} }
    reps bodyweight → { mostReps: {v} }
    time → { longest: {w,v} }   distance → { farthest: {w,v} } */
export function personalRecords(workouts) {
  const prs = {};
  for (const w of workouts) {
    for (const e of w.entries) {
      const metric = entryMetric(e), weighted = entryWeighted(e);
      for (const s of e.sets) {
        if (!s.done || s.v <= 0) continue;
        const p = prs[e.exerciseId] || (prs[e.exerciseId] = { exerciseId: e.exerciseId, metric, weighted });
        if (metric === 'reps' && weighted) {
          if (s.w <= 0) continue;
          const val = epley(s.w, s.v);
          if (!p.bestOneRm || val > p.bestOneRm.val) p.bestOneRm = { w: s.w, v: s.v, val };
          if (!p.heaviest || s.w > p.heaviest.w) p.heaviest = { w: s.w, v: s.v };
        } else if (metric === 'reps') {
          if (!p.mostReps || s.v > p.mostReps.v) p.mostReps = { v: s.v };
        } else if (metric === 'time') {
          if (!p.longest || s.v > p.longest.v) p.longest = { w: s.w, v: s.v };
        } else if (!p.farthest || s.v > p.farthest.v) {
          p.farthest = { w: s.w, v: s.v };
        }
      }
    }
  }
  const rank = (p) => (p.bestOneRm ? p.bestOneRm.val : p.longest ? p.longest.v : p.farthest ? p.farthest.v : p.mostReps ? p.mostReps.v : 0);
  return Object.values(prs).filter((p) => rank(p) > 0).sort((a, b) => rank(b) - rank(a));
}

export const totalVolume = (workouts) => workouts.reduce((a, w) => a + workoutVolume(w), 0);

/** Chronological per-session summaries for one exercise, honoring the entry
    metric: { when, workoutId, metric, weighted, sets, top:{w,v}, e1rm?, volume? } */
export function exerciseSessions(workouts, exerciseId) {
  return [...workouts]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((w) => {
      const entry = w.entries.find((e) => e.exerciseId === exerciseId);
      if (!entry) return null;
      const done = entry.sets.filter((s) => s.done && s.v > 0);
      if (!done.length) return null;
      const metric = entry.metric || 'reps';
      const weighted = entry.weighted !== undefined ? entry.weighted : true;
      const best = bestSetOf(entry);
      const session = {
        when: w.startedAt, workoutId: w.id, metric, weighted,
        sets: done.length, top: { w: best.w, v: best.v },
      };
      if (metric === 'reps' && weighted) {
        session.e1rm = Math.max(...done.map((s) => epley(s.w, s.v)));
        session.volume = done.reduce((a, s) => a + s.w * s.v, 0);
      }
      return session;
    })
    .filter(Boolean);
}

export const relativeDay = (ts, now = Date.now()) => {
  const today = dayKey(now), that = dayKey(ts);
  if (that === today) return 'Today';
  if (that === dayKey(now - DAY_MS)) return 'Yesterday';
  const d = new Date(ts);
  const days = Math.round((new Date(today + 'T12:00:00') - new Date(that + 'T12:00:00')) / DAY_MS);
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
