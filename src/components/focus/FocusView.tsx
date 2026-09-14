import React, { useEffect, useMemo, useState } from "react";
import { Ban, BarChart3, Check, Clock3, Coffee, MoreHorizontal, Pause, Play, Plus, SkipForward, Square, X } from "lucide-react";
import FocusTimerRing from "./FocusTimerRing";
import TaskPicker from "./TaskPicker";
import { useFocusTasks } from "../../hooks/useFocusTasks";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useWorkspaces } from "../../hooks/useWorkspaces";

const durations = [25, 50, 90];

function formatMinutes(min: number) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const FocusView: React.FC = () => {
  const { tasks, addTask, toggleTask, updateTask } = useFocusTasks();
  const { visibleWorkspaces } = useWorkspaces();
  const { timerState, isRunning, isPaused, timeLeftSec, progress, sessions, todaySessions, focusTodayMin, blockedToday, start, startBreak, pause, resume, end, cancel } = useFocusSession();
  const [durationMin, setDurationMin] = useState(50);
  const [customMin, setCustomMin] = useState("45");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["pendingFocusTaskId"], (data) => {
      if (data.pendingFocusTaskId) { setSelectedTaskId(data.pendingFocusTaskId); chrome.storage.local.remove(["pendingFocusTaskId"]); }
    });
  }, []);

  const activeTask = useMemo(() => tasks.find((task) => task.id === (timerState?.taskId ?? selectedTaskId)) || null, [tasks, timerState?.taskId, selectedTaskId]);
  const effectiveMinutes = useCustom ? Math.max(1, parseInt(customMin || "0", 10) || 0) : durationMin;
  const ringMin = isRunning ? Math.floor(timeLeftSec / 60) : effectiveMinutes;
  const ringSec = isRunning ? timeLeftSec % 60 : 0;
  const openTasks = tasks.filter((task) => task.status !== "done");
  const doneToday = todaySessions.filter((session) => session.completed).length;
  const totalToday = Math.max(todaySessions.length, 1);
  const focusScore = useMemo(() => {
    if (!todaySessions.length) return "—";
    const completion = doneToday / todaySessions.length;
    const blocksPerHour = blockedToday / Math.max(.5, focusTodayMin / 60);
    return `${Math.max(0, Math.min(100, Math.round(70 * completion + 30 * Math.max(0, 1 - blocksPerHour / 4))))}%`;
  }, [todaySessions.length, doneToday, blockedToday, focusTodayMin]);
  const dateLabel = new Date().toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  const handleStart = async () => {
    const task = activeTask || openTasks[0] || null;
    const workspaceId = selectedWorkspaceId || task?.workspaceId || null;
    try {
      const summary = await start(task?.id ?? null, task?.title || "Focus session", effectiveMinutes, workspaceId);
      if (task && workspaceId) updateTask(task.id, { workspaceId });
      setNotice((summary as any)?.permissionNeeded ? "Focus started. Enable blocking in Settings when you want it." : `${(summary as any)?.hiddenCount || 0} unrelated tabs tucked away safely.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to start focus"); }
  };

  const handleAdd = () => {
    const created = addTask(newTaskTitle, effectiveMinutes);
    if (created) setSelectedTaskId(created.id);
    setNewTaskTitle("");
    setAdding(false);
  };

  const handlePickerCreate = (title: string) => {
    const created = addTask(title, effectiveMinutes);
    if (!created) return false;
    if (!isRunning) setSelectedTaskId(created.id);
    return true;
  };

  const statItems = [
    { label: "Focus time today", value: formatMinutes(focusTodayMin), Icon: Clock3, color: "text-white" },
    { label: "Sessions completed", value: `${doneToday} / ${totalToday}`, Icon: Check, color: "text-emerald-300" },
    { label: "Distractions blocked", value: `${blockedToday}`, Icon: Ban, color: "text-white" },
    { label: "Focus score", value: focusScore, Icon: BarChart3, color: "text-orange-300" },
  ];

  return (
    <div className="focus-screen h-full overflow-y-auto px-[clamp(28px,4vw,64px)] pb-5 pt-[92px] custom-scrollbar">
      <div className="focus-main mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)_370px] gap-[clamp(36px,4vw,56px)] max-[980px]:grid-cols-1">
        <section className="mx-auto w-full min-w-0 max-w-[560px]">
          <div className="eyebrow">Focus Session</div>
          <h1 className="screen-title mt-1 text-[40px] leading-[1.08]">Deep work starts here.</h1>
          <p className="mt-1 text-[16px] text-white/55">Less noise. More progress.</p>

          <div className="focus-timer-block mt-2 flex flex-col items-center">
            <FocusTimerRing minutes={ringMin} seconds={ringSec} progress={isRunning ? progress : .28} />
            <div className="focus-durations mt-1 flex items-center gap-3">
              {durations.map((duration) => <button key={duration} disabled={isRunning} onClick={() => { setDurationMin(duration); setUseCustom(false); }} className={`min-w-[84px] rounded-full px-5 py-2.5 text-[13px] ${!useCustom && durationMin === duration ? "glass-btn-active font-medium" : "glass-pill text-white/70"}`}>{duration}m</button>)}
              {useCustom ? <div className="glass-btn-active flex items-center rounded-full px-4 py-2 text-[13px]"><input autoFocus value={customMin} disabled={isRunning} onChange={(e) => setCustomMin(e.target.value.replace(/\D/g, "").slice(0, 3))} className="w-12 bg-transparent text-center outline-none"/><span className="text-white/55">m</span><button onClick={() => setUseCustom(false)} className="ml-2"><X className="h-3.5 w-3.5"/></button></div> : <button disabled={isRunning} onClick={() => setUseCustom(true)} className="glass-pill min-w-[98px] px-5 py-2.5 text-[13px] text-white/70">Custom</button>}
            </div>

            <TaskPicker tasks={openTasks} selectedTaskId={isRunning ? timerState?.taskId || null : selectedTaskId} fallbackMinutes={effectiveMinutes} sessionLocked={isRunning} onSelect={setSelectedTaskId} onCreate={handlePickerCreate} />
            {!isRunning && visibleWorkspaces.length > 0 && <select value={selectedWorkspaceId || activeTask?.workspaceId || ""} onChange={(e) => setSelectedWorkspaceId(e.target.value || null)} className="mt-2 w-full max-w-[540px] rounded-xl border border-white/15 bg-[#253128]/85 px-4 py-2 text-center text-[12px] text-white/70 outline-none"><option value="">Keep current browser context</option>{visibleWorkspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>Open {workspace.name} · {workspace.tabs.length} tabs</option>)}</select>}

            <div className="focus-actions mt-3 grid w-full max-w-[520px] grid-cols-3 gap-3">
              {!isRunning ? <button onClick={handleStart} className="mint-button flex h-[50px] items-center justify-center gap-2 text-[14px]"><Play className="h-4 w-4 fill-current"/>Start Focus</button> : <button onClick={isPaused ? resume : pause} className="mint-button flex h-[50px] items-center justify-center gap-2 text-[14px]">{isPaused ? <Play className="h-4 w-4 fill-current"/> : <Pause className="h-4 w-4 fill-current"/>}{isPaused ? "Resume" : "Pause"}</button>}
              <button onClick={() => end(true)} disabled={!isRunning} className="glass-panel flex h-[50px] items-center justify-center gap-2 text-[13px] disabled:opacity-40"><Square className="h-3.5 w-3.5 fill-current"/>End Session</button>
              {isRunning ? <button onClick={() => cancel()} className="glass-panel flex h-[50px] items-center justify-center gap-2 text-[13px]"><SkipForward className="h-4 w-4"/>Abandon</button> : <button onClick={() => startBreak(5)} className="glass-panel flex h-[50px] items-center justify-center gap-2 text-[13px]"><Coffee className="h-4 w-4"/>5m Break</button>}
            </div>
            {notice && <div role="status" className="mt-2 text-center text-[12px] text-emerald-200">{notice}</div>}
          </div>
        </section>

        <aside className="focus-aside flex flex-col gap-4">
          <section className="glass-panel p-5">
            <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Today's Focus Queue</h2><span className="text-[12px] text-white/65">{dateLabel}</span></div>
            <div className="my-3 h-px bg-white/15" />
            {tasks.length ? <ul className="space-y-3">{tasks.slice(0, 4).map((task) => <li key={task.id}><button onClick={() => !isRunning && setSelectedTaskId(task.id)} className="flex w-full items-center gap-3 text-left"><span onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }} className={`flex h-5 w-5 items-center justify-center rounded-[5px] border ${task.status === "done" ? "border-emerald-300 bg-emerald-300 text-emerald-950" : "border-white/55 text-transparent"}`}><Check className="h-3.5 w-3.5" strokeWidth={3}/></span><span className={`min-w-0 flex-1 truncate text-[14px] ${task.status === "done" ? "text-white/50 line-through" : "text-white/90"}`}>{task.title}</span><span className="text-[12px] text-white/55">{task.estimatedMinutes || effectiveMinutes}m</span></button></li>)}</ul> : <p className="py-2 text-[13px] text-white/48">Nothing queued yet.</p>}
            <div className="my-3 h-px bg-white/15" />
            {adding ? <div className="flex gap-2"><input autoFocus value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }} placeholder="Task title" className="min-w-0 flex-1 rounded-lg bg-black/20 px-3 py-2 text-[13px] outline-none"/><button onClick={handleAdd} className="text-[13px] text-emerald-200">Add</button></div> : <button onClick={() => setAdding(true)} className="flex w-full items-center gap-3 text-[13px] text-white/75"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#243028]"><Plus className="h-4 w-4"/></span><span className="flex-1 text-left">Add a task</span><span>{openTasks.length} left</span></button>}
          </section>

          <section className="glass-panel p-5">
            <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Session History</h2><button className="flex items-center gap-1 text-[12px] text-white/65">See all <MoreHorizontal className="h-4 w-4"/></button></div>
            <div className="my-3 h-px bg-white/15" />
            {sessions.length ? <ul className="space-y-3">{sessions.slice(0, 3).map((session) => { const date = new Date(session.startedAt); return <li key={session.id} className="flex items-center gap-3 text-[13px]"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${session.completed ? "border-emerald-300 bg-emerald-300 text-emerald-950" : "border-white/60"}`}>{session.completed && <Check className="h-3 w-3" strokeWidth={3}/>}</span><span className="min-w-0 flex-1 truncate text-white/85">{session.taskTitle}</span><span className="text-white/55">{session.plannedMinutes}m</span><span className="w-[70px] text-right text-white/55">{date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Earlier"}</span></li>; })}</ul> : <p className="py-2 text-[13px] text-white/48">No sessions yet.</p>}
          </section>
        </aside>
      </div>

      <section className="focus-stats glass-panel mx-auto mt-4 grid w-full max-w-[1120px] grid-cols-4 divide-x divide-white/15 px-3 py-3">
        {statItems.map(({ label, value, Icon, color }) => <div key={label} className="flex items-center gap-3 px-4"><Icon className={`h-6 w-6 shrink-0 ${color}`} strokeWidth={1.7}/><div><div className="text-[11px] text-white/50">{label}</div><div className="text-[18px] font-semibold leading-tight">{value}</div></div></div>)}
      </section>
    </div>
  );
};

export default FocusView;
