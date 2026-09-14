import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUp, Check, Play, Plus, Search, X } from "lucide-react";
import { AppTab } from "../../types/Focus";
import { BrowserHealth, sendExtensionMessage } from "../../types/Messages";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useFocusTasks } from "../../hooks/useFocusTasks";
import { useWorkspaces } from "../../hooks/useWorkspaces";

interface HomeViewProps { onNavigate: (tab: AppTab) => void; onOpenSearch: () => void; }

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ""}`.trim();
}

const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenSearch }) => {
  const { tasks, addTask, toggleTask, updateTask, moveTask } = useFocusTasks();
  const { timerState, isRunning, isPaused, timeLeftSec, start, pause, resume, focusTodayMin, blockedToday, todaySessions } = useFocusSession();
  const { visibleWorkspaces, createWorkspace, resumeWorkspace } = useWorkspaces();
  const [duration, setDuration] = useState(50);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState("");
  const [health, setHealth] = useState<BrowserHealth | null>(null);
  const [showHealth, setShowHealth] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastWorkspaceId, setLastWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    sendExtensionMessage<BrowserHealth>("tabs.health").then((response) => response.ok && response.data && setHealth(response.data));
    chrome.storage.local.get(["lastWorkspaceId"], (data) => setLastWorkspaceId(data.lastWorkspaceId || null));
  }, []);

  useEffect(() => {
    if (!selectedTaskId) setSelectedTaskId(tasks.find((task) => task.status === "todo")?.id || null);
  }, [tasks, selectedTaskId]);

  const selectedTask = tasks.find((task) => task.id === (timerState?.taskId || selectedTaskId));
  const recentWorkspace = visibleWorkspaces.find((w) => w.id === lastWorkspaceId) || [...visibleWorkspaces].sort((a, b) => String(b.lastActiveAt || "").localeCompare(String(a.lastActiveAt || "")))[0];
  const todo = tasks.filter((task) => task.status === "todo");
  const later = tasks.filter((task) => task.status === "later");
  const doneToday = tasks.filter((task) => task.status === "done" && String(task.completedAt || "").startsWith(new Date().toISOString().slice(0, 10))).length;
  const focusScore = useMemo(() => {
    if (!todaySessions.length && !doneToday) return "—";
    const completion = Math.min(1, doneToday / Math.max(1, todo.length + doneToday));
    const sessionRate = todaySessions.filter((session) => session.completed).length / Math.max(1, todaySessions.length);
    const distractionPenalty = Math.min(30, blockedToday * 4);
    return `${Math.max(0, Math.round(45 * completion + 55 * sessionRate - distractionPenalty))}`;
  }, [todaySessions, doneToday, todo.length, blockedToday]);
  const hasSnapshot = focusTodayMin > 0 || doneToday > 0 || blockedToday > 0 || todaySessions.length > 0;

  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(""), 2600); };
  const add = () => {
    const task = addTask(newTask, duration);
    if (task) { setSelectedTaskId(task.id); setNewTask(""); }
  };
  const handleStart = async () => {
    try {
      await start(selectedTask?.id || null, selectedTask?.title || "Focus session", duration, selectedTask?.workspaceId || null);
      flash("Focus mode started — unrelated tabs are tucked away safely.");
    } catch (error) { flash(error instanceof Error ? error.message : "Could not start focus"); }
  };
  const cleanup = async (ids: number[], label: string) => {
    if (!ids.length) return;
    if (!window.confirm(`Close ${ids.length} tab${ids.length === 1 ? "" : "s"}? This cannot be undone by FocusTab.`)) return;
    const response = await sendExtensionMessage<BrowserHealth>("tabs.close", { tabIds: ids });
    if (response.ok && response.data) { setHealth(response.data); flash(label); }
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-24 pt-24 custom-scrollbar sm:px-10">
      <div className="mx-auto w-full max-w-[1080px]">
        <div className="text-center">
          <div className="eyebrow">{greeting()}</div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Ready to focus?</h1>
        </div>

        <section className="mx-auto mt-7 max-w-[620px] text-center">
          <div className="font-mono text-[70px] font-light leading-none tracking-[-0.07em] text-white sm:text-[92px]">
            {isRunning ? `${Math.floor(timeLeftSec / 60).toString().padStart(2, "0")}:${(timeLeftSec % 60).toString().padStart(2, "0")}` : `${duration}:00`}
          </div>
          {isRunning ? (
            <div className="mt-4">
              <div className="text-lg text-white/90">{timerState?.title}</div>
              <div className="mt-4 flex justify-center gap-3">
                <button onClick={isPaused ? resume : pause} className="rounded-2xl bg-emerald-300 px-7 py-3 font-semibold text-emerald-950">{isPaused ? "Resume" : "Pause"}</button>
                <button onClick={() => onNavigate("focus")} className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-white">Session details</button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 flex justify-center gap-2">
                {[25, 50, 90].map((value) => <button key={value} onClick={() => setDuration(value)} className={`rounded-full px-4 py-1.5 text-sm ${duration === value ? "bg-emerald-300/25 text-emerald-100 ring-1 ring-emerald-300/60" : "bg-white/10 text-white/60"}`}>{value}m</button>)}
              </div>
              <select value={selectedTaskId || ""} onChange={(e) => setSelectedTaskId(e.target.value || null)} className="mt-4 w-full max-w-[430px] rounded-2xl border border-white/15 bg-black/35 px-4 py-3.5 text-center text-white outline-none [&>option]:text-black">
                <option value="">Focus without a task</option>
                {todo.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
              <div><button onClick={handleStart} className="mint-button mt-4 inline-flex items-center gap-2 px-10 py-3.5 text-[15px]"><Play className="h-4 w-4 fill-current"/>Start Focus</button></div>
            </>
          )}
        </section>

        {recentWorkspace && !isRunning && (
          <section className="glass-panel mx-auto mt-8 flex max-w-[720px] items-center gap-4 px-5 py-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200"><ArrowRight className="h-5 w-5"/></div>
            <div className="min-w-0 flex-1"><div className="text-xs uppercase tracking-widest text-white/50">Continue where you left off?</div><div className="mt-1 truncate text-base font-medium">{recentWorkspace.name} · {recentWorkspace.tabs.length} tabs</div></div>
            <button onClick={() => { resumeWorkspace(recentWorkspace.id); flash(`Resuming ${recentWorkspace.name}`); }} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm">Resume workspace</button>
          </section>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {todo.length > 0 ? <section className="glass-panel p-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Today</h2><button onClick={() => onNavigate("focus")} className="flex items-center gap-1 text-xs text-white/55">All tasks <ArrowRight className="h-3.5 w-3.5"/></button></div>
            <div className="mt-3 space-y-2">
              {todo.slice(0, 5).map((task, index) => (
                <div key={task.id} className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-3 py-2.5">
                  <button onClick={() => toggleTask(task.id)} className="flex h-5 w-5 items-center justify-center rounded-md border border-white/35 text-transparent hover:border-emerald-300" aria-label={`Complete ${task.title}`}><Check className="h-3 w-3"/></button>
                  <button onClick={() => setSelectedTaskId(task.id)} className={`min-w-0 flex-1 truncate text-left text-sm ${selectedTaskId === task.id ? "text-emerald-200" : "text-white/85"}`}>{task.title}</button>
                  <span className="text-xs text-white/40">{task.estimatedMinutes || 25}m</span>
                  <button disabled={index === 0} onClick={() => moveTask(task.id, -1)} className="text-white/35 disabled:opacity-20" aria-label="Move task up"><ArrowUp className="h-3.5 w-3.5"/></button>
                  <button onClick={() => updateTask(task.id, { status: "later" })} className="text-xs text-white/45 hover:text-white">Later</button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a task…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none"/><button onClick={add} className="rounded-xl bg-white/10 px-4 text-sm">Add</button></div>
            {later.length > 0 && <button onClick={() => onNavigate("focus")} className="mt-3 text-xs text-white/45">{later.length} saved for later</button>}
          </section> : <section className="glass-panel flex h-[62px] items-center gap-3 px-4"><div className="w-[72px] shrink-0"><div className="text-sm font-semibold">Today</div><div className="text-[11px] text-white/40">No tasks</div></div><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add one thing…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"/><button onClick={add} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Add</button></section>}

          {visibleWorkspaces.length > 0 ? <section className="glass-panel p-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-semibold">Workspaces</h2><button onClick={() => onNavigate("workspaces")} className="flex items-center gap-1 text-xs text-white/55">Manage <ArrowRight className="h-3.5 w-3.5"/></button></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {visibleWorkspaces.slice(0, 4).map((workspace) => <button key={workspace.id} onClick={() => { resumeWorkspace(workspace.id); flash(`Resuming ${workspace.name}`); }} className="rounded-xl bg-white/[0.06] p-3 text-left hover:bg-white/10"><div className="truncate text-sm font-medium">{workspace.name}</div><div className="mt-1 text-xs text-white/45">{workspace.tabs.length} tabs</div></button>)}
            </div>
          </section> : <section className="glass-panel flex h-[62px] items-center gap-3 px-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200"><Plus className="h-4 w-4"/></span><div className="min-w-0 flex-1"><div className="text-sm font-semibold">Workspaces</div><div className="text-[11px] text-white/40">No saved contexts</div></div><button onClick={() => { const ws = createWorkspace("My workspace"); onNavigate("workspaces"); flash(`Created ${ws.name}`); }} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-emerald-100">Create</button></section>}
        </div>

        {hasSnapshot ? <section className="glass-panel mt-4 grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4 text-center"><div className="text-xl font-semibold">{formatMinutes(focusTodayMin)}</div><div className="text-xs text-white/45">focused today</div></div>
          <div className="p-4 text-center"><div className="text-xl font-semibold">{doneToday}</div><div className="text-xs text-white/45">tasks done</div></div>
          <div className="p-4 text-center"><div className="text-xl font-semibold">{blockedToday}</div><div className="text-xs text-white/45">distractions blocked</div></div>
          <button onClick={() => setShowHealth(!showHealth)} className="p-4 text-center hover:bg-white/5"><div className="text-xl font-semibold">{focusScore}</div><div className="text-xs text-white/45">focus score · browser health</div></button>
        </section> : <button onClick={() => setShowHealth(!showHealth)} className="mx-auto mt-4 block text-xs text-white/45 hover:text-white/70">Today · no activity yet &nbsp;·&nbsp; View browser health</button>}

        {showHealth && health && (
          <section className="glass-panel mt-3 p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Browser health</h2><button onClick={() => setShowHealth(false)} className="text-white/50"><X className="h-4 w-4"/></button></div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.05] p-3"><div className="text-2xl font-semibold">{health.openCount}</div><div className="text-xs text-white/50">open web tabs</div></div>
              <div className="rounded-xl bg-white/[0.05] p-3"><div className="text-2xl font-semibold">{health.duplicateCount}</div><div className="text-xs text-white/50">duplicates</div>{health.duplicateCount > 0 && <button onClick={() => cleanup(health.duplicateTabIds, `Closed ${health.duplicateCount} duplicates`)} className="mt-2 text-xs text-emerald-200">Review and close exact duplicates</button>}</div>
              <div className="rounded-xl bg-white/[0.05] p-3"><div className="text-2xl font-semibold">{health.staleCount}</div><div className="text-xs text-white/50">inactive for 7+ days</div>{health.staleCount > 0 && <button onClick={() => cleanup(health.staleTabs.map((tab) => tab.id), `Closed ${health.staleCount} stale tabs`)} className="mt-2 text-xs text-amber-200">Close stale tabs</button>}</div>
            </div>
            {health.suggestedGroups.length > 0 && <div className="mt-4"><div className="text-xs uppercase tracking-widest text-white/45">Suggested groups — you approve every change</div><div className="mt-2 flex flex-wrap gap-2">{health.suggestedGroups.map((group) => <button key={group.name} onClick={async () => { const response = await sendExtensionMessage<BrowserHealth>("tabs.group", { name: group.name, tabIds: group.tabIds }); if (response.ok && response.data) setHealth(response.data); }} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">Group {group.count} · {group.name}</button>)}</div></div>}
          </section>
        )}

        <button onClick={onOpenSearch} className="glass-pill mx-auto mt-5 flex w-full max-w-[580px] items-center gap-4 px-6 py-3.5 text-left"><Search className="h-5 w-5 text-white/70"/><span className="flex-1 text-sm text-white/55">Search tabs, history, tasks…</span><span className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/55">⌘ K</span></button>
      </div>
      {notice && <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-200 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-2xl">{notice}</div>}
    </div>
  );
};

export default HomeView;
