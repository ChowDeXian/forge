/* Pure helpers: units, 1RM, volume, streaks, PRs. Weights are stored in kg. */

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

/** Stepper increment expressed in kg for the active unit (2.5 kg / 5 lb). */
export const weightStepKg = (unit) => (unit === 'lbs' ? 5 * KG_PER_LB : 2.5);

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

/** Epley estimated 1RM. */
export const epley = (w, r) => (r <= 1 ? w : w * (1 + r / 30));

/** 'YYYY-MM-DD' key in local time. */
export const dayKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const doneSets = (workout) =>
  workout.entries.flatMap((e) => e.sets.filter((s) => s.done).map((s) => ({ ...s, exerciseId: e.exerciseId })));

export const workoutVolume = (workout) =>
  doneSets(workout).reduce((a, s) => a + s.w * s.r, 0);

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

/** Most recent done performance of an exercise: { w, r, when } or null. */
export function lastPerformance(workouts, exerciseId) {
  const sorted = [...workouts].sort((a, b) => b.startedAt - a.startedAt);
  for (const w of sorted) {
    const entry = w.entries.find((e) => e.exerciseId === exerciseId);
    const done = entry ? entry.sets.filter((s) => s.done) : [];
    if (done.length) {
      const best = done.reduce((a, s) => (epley(s.w, s.r) > epley(a.w, a.r) ? s : a));
      return { w: best.w, r: best.r, when: w.startedAt };
    }
  }
  return null;
}

/** Per-workout best est. 1RM series for an exercise, oldest first. */
export function oneRmSeries(workouts, exerciseId) {
  return [...workouts]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((w) => {
      const entry = w.entries.find((e) => e.exerciseId === exerciseId);
      const done = entry ? entry.sets.filter((s) => s.done && s.w > 0 && s.r > 0) : [];
      if (!done.length) return null;
      return { when: w.startedAt, oneRm: Math.max(...done.map((s) => epley(s.w, s.r))) };
    })
    .filter(Boolean);
}

/** Exercise ids that appear in history, most-trained first. */
export function trainedExerciseIds(workouts) {
  const count = {};
  for (const w of workouts) for (const e of w.entries) if (e.sets.some((s) => s.done)) count[e.exerciseId] = (count[e.exerciseId] || 0) + 1;
  return Object.keys(count).sort((a, b) => count[b] - count[a]);
}

/** PRs per exercise: { exerciseId, bestOneRm:{w,r,v}, heaviest:{w,r}, mostReps:{w,r} }. */
export function personalRecords(workouts) {
  const prs = {};
  for (const w of workouts) {
    for (const e of w.entries) {
      for (const s of e.sets) {
        if (!s.done || s.w <= 0 || s.r <= 0) continue;
        const p = prs[e.exerciseId] || (prs[e.exerciseId] = { exerciseId: e.exerciseId, bestOneRm: null, heaviest: null, mostReps: null });
        const v = epley(s.w, s.r);
        if (!p.bestOneRm || v > p.bestOneRm.v) p.bestOneRm = { w: s.w, r: s.r, v };
        if (!p.heaviest || s.w > p.heaviest.w) p.heaviest = { w: s.w, r: s.r };
        if (!p.mostReps || s.r > p.mostReps.r) p.mostReps = { w: s.w, r: s.r };
      }
    }
  }
  return Object.values(prs).sort((a, b) => b.bestOneRm.v - a.bestOneRm.v);
}

export const totalVolume = (workouts) => workouts.reduce((a, w) => a + workoutVolume(w), 0);

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
