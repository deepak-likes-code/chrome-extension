import { FocusSessionRecord, FocusTask } from "../types/Focus";

export interface TimeEntry {
  domain: string;
  duration: number;
  date: string;
  startTime?: number;
  lastUpdate?: number;
}

export interface BlockedEvent {
  hostname: string;
  url?: string;
  date: string;
  domain?: string;
  at?: string;
}

export function fmtMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function dayKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

function startOfWeekMonday(base: Date): Date {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export interface WeekBuckets {
  thisWeekStart: Date;
  lastWeekStart: Date;
}

export function weekBounds(now = new Date()): WeekBuckets {
  const thisWeekStart = startOfWeekMonday(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return { thisWeekStart, lastWeekStart };
}

function inRange(iso: string | undefined, start: Date, end: Date): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

export function pctChange(curr: number, prev: number): { pct: number; hasPrev: boolean } {
  if (prev <= 0) return { pct: curr > 0 ? 100 : 0, hasPrev: prev > 0 };
  return { pct: Math.round(((curr - prev) / prev) * 100), hasPrev: true };
}

function normalizeDomain(h: string): string {
  return h.toLowerCase().replace(/^www\./, "");
}

export function distractionMinutes(
  entries: TimeEntry[],
  blockedDomains: Set<string>,
  start: Date,
  end: Date
): number {
  let ms = 0;
  for (const e of entries) {
    const d = e.date?.includes("T") ? e.date : `${e.date}T12:00:00`;
    if (!inRange(d, start, end)) continue;
    if (blockedDomains.has(normalizeDomain(e.domain))) ms += e.duration || 0;
  }
  return ms / 60000;
}

export interface InsightAggregates {
  focusWeekMin: number;
  focusPrevMin: number;
  tasksDoneWeek: number;
  tasksDonePrev: number;
  distractionWeekMin: number;
  distractionPrevMin: number;
  scoreWeek: number | null;
  scorePrev: number | null;
  switchesWeek: number;
  switchesPrev: number;
  trends: { day: string; value: number }[];
  daily: { focusMin: number; tasksDone: number; distractionMin: number; score: number | null };
  weekLabel: string;
}

export function computeInsights(
  sessions: FocusSessionRecord[],
  tasks: FocusTask[],
  entries: TimeEntry[],
  blockedEvents: BlockedEvent[],
  blocklistDomains: string[],
  now = new Date()
): InsightAggregates {
  const { thisWeekStart, lastWeekStart } = weekBounds(now);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

  const sessIn = (s: FocusSessionRecord, a: Date, b: Date) => inRange(s.startedAt, a, b);

  const focusWeekMin = sessions.filter((s) => sessIn(s, thisWeekStart, thisWeekEnd)).reduce((x, s) => x + (s.actualMinutes || 0), 0);
  const focusPrevMin = sessions.filter((s) => sessIn(s, lastWeekStart, thisWeekStart)).reduce((x, s) => x + (s.actualMinutes || 0), 0);

  const taskDoneIn = (t: FocusTask, a: Date, b: Date) => {
    if (t.status !== "done") return false;
    if (!t.completedAt) return true; // undated done tasks count toward current week only
    return inRange(t.completedAt, a, b);
  };
  const tasksDoneWeek = tasks.filter((t) => taskDoneIn(t, thisWeekStart, thisWeekEnd)).length;
  const tasksDonePrev = tasks.filter((t) => t.completedAt && inRange(t.completedAt, lastWeekStart, thisWeekStart)).length;

  const blockedSet = new Set(blocklistDomains.map(normalizeDomain));
  let distractionWeekMin = distractionMinutes(entries, blockedSet, thisWeekStart, thisWeekEnd);
  let distractionPrevMin = distractionMinutes(entries, blockedSet, lastWeekStart, thisWeekStart);

  const scoreFor = (sess: FocusSessionRecord[], blocks: number, focusMin: number): number | null => {
    if (sess.length === 0) return null;
    const completion = sess.filter((s) => s.completed).length / sess.length;
    const blocksPerHour = blocks / Math.max(0.5, focusMin / 60);
    return Math.min(100, Math.max(0, Math.round(70 * completion + 30 * Math.max(0, 1 - blocksPerHour / 4))));
  };
  const sessWeek = sessions.filter((s) => sessIn(s, thisWeekStart, thisWeekEnd));
  const sessPrev = sessions.filter((s) => sessIn(s, lastWeekStart, thisWeekStart));
  const blocksWeek = blockedEvents.filter((e) => inRange(e.date, thisWeekStart, thisWeekEnd)).length;
  const blocksPrev = blockedEvents.filter((e) => inRange(e.date, lastWeekStart, thisWeekStart)).length;
  const scoreWeek = scoreFor(sessWeek, blocksWeek, focusWeekMin);
  const scorePrev = scoreFor(sessPrev, blocksPrev, focusPrevMin);

  // Context switches: actual consecutive domain changes recorded by tab activation.
  const distinctIn = (a: Date, b: Date) => {
    let switches = 0;
    let previous = "";
    const ordered = [...entries].sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime());
    for (const e of ordered) {
      const d = e.date?.includes("T") ? e.date : `${e.date}T12:00:00`;
      if (!inRange(d, a, b)) continue;
      const current = normalizeDomain(e.domain);
      if (previous && current !== previous) switches += 1;
      previous = current;
    }
    return switches;
  };
  const switchesWeek = distinctIn(thisWeekStart, thisWeekEnd);
  const switchesPrev = distinctIn(lastWeekStart, thisWeekStart);

  // Trends: last 7 days ending today, hours with 1 decimal
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const trends: { day: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    const min = sessions.filter((s) => (s.startedAt || "").startsWith(key)).reduce((x, s) => x + (s.actualMinutes || 0), 0);
    trends.push({ day: days[d.getDay()], value: Math.round((min / 60) * 10) / 10 });
  }

  // Daily (today)
  const todayKey = dayKey(now);
  const todaySess = sessions.filter((s) => (s.startedAt || "").startsWith(todayKey));
  const dailyFocus = todaySess.reduce((x, s) => x + (s.actualMinutes || 0), 0);
  const dailyTasks = tasks.filter((t) => t.status === "done" && (!t.completedAt || t.completedAt.startsWith(todayKey))).length;
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  let dailyDistraction = distractionMinutes(entries, blockedSet, dayStart, dayEnd);
  const dailyScore = scoreFor(todaySess, blockedEvents.filter((e) => inRange(e.date, dayStart, dayEnd)).length, dailyFocus);

  const fmtRange = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
  const weekEnd = new Date(thisWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${fmtRange(thisWeekStart)} – ${fmtRange(weekEnd)}, ${thisWeekStart.getFullYear()}`;

  return {
    focusWeekMin,
    focusPrevMin,
    tasksDoneWeek,
    tasksDonePrev,
    distractionWeekMin,
    distractionPrevMin,
    scoreWeek,
    scorePrev,
    switchesWeek,
    switchesPrev,
    trends,
    daily: { focusMin: dailyFocus, tasksDone: dailyTasks, distractionMin: dailyDistraction, score: dailyScore },
    weekLabel,
  };
}
