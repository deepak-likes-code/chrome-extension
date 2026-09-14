import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Clock3, ListTodo, Plus, Target, X } from "lucide-react";
import { FocusTask } from "../../types/Focus";

interface TaskPickerProps {
  tasks: FocusTask[];
  selectedTaskId: string | null;
  fallbackMinutes: number;
  sessionLocked: boolean;
  onSelect: (taskId: string | null) => void;
  onCreate: (title: string) => boolean;
}

const TaskPicker: React.FC<TaskPickerProps> = ({ tasks, selectedTaskId, fallbackMinutes, sessionLocked, onSelect, onCreate }) => {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedTaskId) || null, [tasks, selectedTaskId]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", keyboard);
    };
  }, [open]);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  const select = (taskId: string | null) => {
    if (sessionLocked) return;
    onSelect(taskId);
    setOpen(false);
  };

  const create = () => {
    const title = draft.trim();
    if (!title || !onCreate(title)) return;
    setDraft("");
    setCreating(false);
    setOpen(false);
  };

  const triggerTitle = sessionLocked
    ? selectedTask?.title || "Focus without a task"
    : selectedTask?.title || "Select a task…";

  return (
    <div ref={rootRef} className="focus-task-shell relative z-40 mt-4 w-full max-w-[520px]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`glass-panel flex h-[54px] w-full items-center gap-3 px-4 text-left transition ${open ? "border-emerald-200/45 bg-emerald-200/[0.08]" : "hover:border-white/30"}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-emerald-300/10 text-emerald-200">
          <Target className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[14px] ${selectedTask || sessionLocked ? "text-white/90" : "text-white/65"}`}>{triggerTitle}</span>
          {selectedTask && <span className="mt-0.5 block text-[10px] text-white/40">{selectedTask.estimatedMinutes || fallbackMinutes} min · focus task</span>}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/45 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-full overflow-hidden rounded-[18px] border border-white/20 bg-[#17231e]/95 shadow-[0_22px_60px_rgba(0,0,0,.42)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="text-[13px] font-semibold text-white/90">Choose a focus task</div>
              <div className="mt-0.5 text-[10px] text-white/40">{tasks.length ? `${tasks.length} available` : "Your queue is clear"}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close task picker" className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          {sessionLocked && (
            <div className="mx-3 mt-3 rounded-xl border border-emerald-200/10 bg-emerald-200/[0.06] px-3 py-2 text-[11px] leading-4 text-emerald-100/70">
              This session keeps its current task. You can add another task for later.
            </div>
          )}

          <div role="listbox" aria-label="Focus tasks" className="max-h-[190px] overflow-y-auto p-2 custom-scrollbar">
            <button type="button" role="option" aria-selected={!selectedTaskId} disabled={sessionLocked} onClick={() => select(null)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-default disabled:opacity-45 ${!selectedTaskId ? "bg-emerald-300/12" : "hover:bg-white/[0.06]"}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.07] text-white/55"><Target className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[13px] text-white/85">Focus without a task</span><span className="block text-[10px] text-white/35">Just start a calm session</span></span>
              {!selectedTaskId && !sessionLocked && <Check className="h-4 w-4 text-emerald-200" strokeWidth={2.5} />}
            </button>

            {tasks.map((task) => {
              const selected = task.id === selectedTaskId;
              return (
                <button key={task.id} type="button" role="option" aria-selected={selected} disabled={sessionLocked} onClick={() => select(task.id)} className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:cursor-default disabled:opacity-45 ${selected ? "bg-emerald-300/12" : "hover:bg-white/[0.06]"}`}>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${selected ? "bg-emerald-300/15 text-emerald-200" : "bg-white/[0.07] text-white/55"}`}><ListTodo className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] text-white/90">{task.title}</span><span className="mt-0.5 flex items-center gap-1 text-[10px] text-white/40"><Clock3 className="h-3 w-3" />{task.estimatedMinutes || fallbackMinutes} min</span></span>
                  {selected && <Check className="h-4 w-4 text-emerald-200" strokeWidth={2.5} />}
                </button>
              );
            })}

            {!tasks.length && (
              <div className="flex items-center gap-3 px-3 py-3 text-[12px] text-white/45"><ListTodo className="h-4 w-4 shrink-0" /><span>No tasks yet. Add one below when you’re ready.</span></div>
            )}
          </div>

          <div className="border-t border-white/10 p-3">
            {creating ? (
              <div className="flex items-center gap-2">
                <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") create(); if (event.key === "Escape") setCreating(false); }} placeholder="What do you want to finish?" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[12px] text-white outline-none placeholder:text-white/30" />
                <button type="button" onClick={create} disabled={!draft.trim()} className="rounded-xl bg-emerald-300 px-3 py-2.5 text-[12px] font-semibold text-emerald-950 disabled:opacity-40">Add</button>
              </div>
            ) : (
              <button type="button" onClick={() => setCreating(true)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-emerald-100/85 hover:bg-white/[0.06]"><Plus className="h-4 w-4" /><span>Add a new task</span></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPicker;
