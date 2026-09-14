import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowLeftRight, ArrowRight, ArrowUp, Ban, BarChart3, CalendarDays, Check, Clock3, Lightbulb, Sparkles, Sun } from "lucide-react";
import { useInsights } from "../../hooks/useInsights";
import { fmtMinutes, pctChange } from "../../utils/insightAggregates";

function delta(current: number, previous: number) {
  const result = pctChange(current, previous);
  if (!result.hasPrev) return { value: current ? 100 : 0, up: true, hasPrev: false };
  return { value: Math.abs(result.pct), up: result.pct >= 0, hasPrev: true };
}

const InsightsView: React.FC = () => {
  const { data, loaded } = useInsights();
  const [metric, setMetric] = useState<"Focus Time" | "Tasks" | "Distractions">("Focus Time");
  const trends = data?.trends || [];
  const maxTrend = Math.max(1, ...trends.map((point) => point.value));
  const metrics = useMemo(() => data ? [
    { label: "Focus Time", value: fmtMinutes(data.focusWeekMin), change: delta(data.focusWeekMin, data.focusPrevMin), Icon: Clock3, positiveUp: true },
    { label: "Tasks Done", value: String(data.tasksDoneWeek), change: delta(data.tasksDoneWeek, data.tasksDonePrev), Icon: Check, positiveUp: true },
    { label: "Distraction Time", value: fmtMinutes(data.distractionWeekMin), change: delta(data.distractionWeekMin, data.distractionPrevMin), Icon: Ban, positiveUp: false },
    { label: "Focus Score", value: data.focusWeekMin === 0 && data.tasksDoneWeek === 0 ? "—" : data.scoreWeek == null ? "—" : `${data.scoreWeek}%`, change: delta(data.scoreWeek || 0, data.scorePrev || 0), Icon: BarChart3, positiveUp: true },
  ] : [], [data]);
  const dateLabel = new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  if (!loaded || !data) return <div className="flex h-full items-center justify-center text-sm text-white/60">Loading your local insights…</div>;

  const patterns = [
    { title: data.focusWeekMin > data.focusPrevMin ? "Focus time is improving" : "Build a consistent focus window", body: `${fmtMinutes(data.focusWeekMin)} focused this week, compared with ${fmtMinutes(data.focusPrevMin)} last week.`, Icon: Sun, tone: "text-yellow-300" },
    { title: `${data.switchesWeek} context switches`, body: data.switchesWeek > 20 ? "Attach a workspace to your next session to reduce switching." : "Your workspace-based flow is keeping context changes contained.", Icon: ArrowLeftRight, tone: "text-rose-300" },
    { title: data.daily.focusMin ? "Keep it up" : "Start with one calm session", body: data.daily.focusMin ? `You have already focused for ${fmtMinutes(data.daily.focusMin)} today.` : "Your first completed session will establish today's baseline.", Icon: Lightbulb, tone: "text-yellow-200" },
  ];
  const hasFocusActivity = data.focusWeekMin > 0 || data.tasksDoneWeek > 0 || data.distractionWeekMin > 0;
  const visiblePatterns = hasFocusActivity ? patterns.slice(0, 2) : [patterns[2]];

  return (
    <div className="reference-responsive h-full overflow-y-auto px-8 pb-24 pt-[98px] custom-scrollbar">
      <div className="mx-auto w-full max-w-[1340px]">
        <header className="flex items-end justify-between gap-6 px-[86px] max-[1100px]:px-0">
          <div><div className="eyebrow">Insights</div><h1 className="screen-title mt-2 text-[47px] leading-none">Your focus, at a glance.</h1><p className="mt-2 text-[18px] text-white/60">Small changes. A more focused you.</p></div>
          <button className="glass-panel flex min-w-[280px] items-center gap-4 px-5 py-4 text-left"><CalendarDays className="h-6 w-6 text-white/80"/><span className="flex-1"><span className="block text-[14px] font-medium">This Week</span><span className="block text-[12px] text-white/55">{data.weekLabel}</span></span><ArrowDown className="h-4 w-4 text-white/60"/></button>
        </header>

        <section className="mt-6 grid grid-cols-4 gap-4">
          {metrics.map(({ label, value, change, Icon, positiveUp }) => { const positive = change.up === positiveUp; const ChangeIcon = change.up ? ArrowUp : ArrowDown; return <article key={label} className="glass-panel p-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Icon className="h-6 w-6" strokeWidth={1.7}/></span><span className="text-[13px] text-white/60">{label}</span><span className="ml-auto text-[24px] font-semibold">{value}</span></div>{change.hasPrev ? <div className={`mt-3 flex items-center justify-end gap-1 text-[11px] ${positive ? "text-emerald-300" : "text-rose-300"}`}><ChangeIcon className="h-3 w-3"/><span>{change.value}%</span><span className="ml-1 text-white/45">vs last week</span></div> : <div className="mt-2 text-right text-[11px] text-white/35">No prior-week baseline</div>}</article>; })}
        </section>

        <section className="mt-4 grid grid-cols-[1.55fr_1fr] gap-4">
          <article className="glass-panel p-5">
            <div className="flex items-start justify-between"><div><h2 className="text-[19px] font-semibold">Focus Trends</h2><p className="text-[13px] text-white/55">Daily focus time over the last 7 days</p></div><div className="flex rounded-xl border border-white/10 bg-black/15 p-1">{(["Focus Time","Tasks","Distractions"] as const).map((item) => <button key={item} onClick={() => setMetric(item)} className={`rounded-lg px-4 py-2 text-[12px] ${metric === item ? "bg-emerald-300/25 text-white" : "text-white/55"}`}>{item}</button>)}</div></div>
            {hasFocusActivity ? <div className="relative mt-5 h-[150px] pl-10"><div className="absolute inset-x-0 top-0 flex h-full flex-col justify-between pb-7 text-[11px] text-white/55">{[6,4,2,0].map((hour) => <div key={hour} className="relative border-t border-white/12"><span className="absolute -left-10 -top-2">{hour}h</span></div>)}</div><div className="absolute inset-x-10 bottom-0 top-0 flex items-end justify-around gap-5 pb-7">{trends.map((point) => <div key={point.day} className="flex h-full flex-1 flex-col items-center justify-end"><div title={`${point.value} hours`} className="w-full max-w-[52px] rounded-t-[6px] border border-emerald-200/45 bg-gradient-to-b from-emerald-200/90 to-emerald-500/55" style={{ height: `${Math.max(4, point.value / maxTrend * 105)}px` }}/><span className="absolute bottom-0 text-[12px] text-white/60">{point.day}</span></div>)}</div></div> : <div className="mt-5 flex h-[92px] items-center justify-center rounded-xl bg-black/10 text-[13px] text-white/45">Your first focus session will start this chart.</div>}
          </article>

          <article className="glass-panel p-5"><div className="flex items-center justify-between"><h2 className="flex items-center gap-3 text-[19px] font-semibold"><Sparkles className="h-6 w-6 text-emerald-200"/>Focus Patterns</h2><span className="text-[12px] text-white/50">Local only</span></div><div className="mt-4 space-y-3">{visiblePatterns.map(({ title, body, Icon, tone }) => <div key={title} className="flex items-center gap-4 rounded-xl bg-white/[0.04] px-4 py-3"><Icon className={`h-6 w-6 shrink-0 ${tone}`} strokeWidth={1.8}/><div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{title}</div><div className="mt-0.5 line-clamp-1 text-[12px] text-white/55">{body}</div></div><ArrowRight className="h-4 w-4 text-white/55"/></div>)}</div></article>
        </section>

        <section className="mt-4">
          <article className="glass-panel p-5"><div className="flex items-start justify-between"><div><h2 className="text-[17px] font-semibold">Today</h2><p className="text-[12px] text-white/50">A quick snapshot</p></div><span className="text-[12px] text-white/55">{dateLabel}</span></div><div className="mt-4 grid grid-cols-4 divide-x divide-white/15">{[
            { label: "Focus Time", value: fmtMinutes(data.daily.focusMin), Icon: Clock3, tone: "text-white" },
            { label: "Tasks Done", value: String(data.daily.tasksDone), Icon: Check, tone: "text-emerald-300" },
            { label: "Distraction Time", value: fmtMinutes(data.daily.distractionMin), Icon: Ban, tone: "text-white" },
            { label: "Focus Score", value: data.daily.score == null ? "—" : `${data.daily.score}%`, Icon: BarChart3, tone: "text-orange-300" },
          ].map(({ label, value, Icon, tone }) => <div key={label} className="flex items-center gap-4 px-5"><Icon className={`h-6 w-6 ${tone}`} strokeWidth={1.7}/><div><div className="text-[11px] text-white/50">{label}</div><div className="text-[18px] font-semibold">{value}</div></div></div>)}</div></article>
        </section>
      </div>
    </div>
  );
};

export default InsightsView;
