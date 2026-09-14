import React, { useEffect, useMemo, useState } from "react";
import { useFocusSession } from "../../hooks/useFocusSession";
import { useFocusTasks } from "../../hooks/useFocusTasks";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { sendExtensionMessage } from "../../types/Messages";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const SidePanelApp: React.FC = () => {
  const { timerState, isRunning, isPaused, timeLeftSec, pause, resume, end } = useFocusSession();
  const { tasks } = useFocusTasks();
  const { visibleWorkspaces } = useWorkspaces();
  const [message, setMessage] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const currentTask = useMemo(() => tasks.find((t) => t.id === timerState?.taskId), [tasks, timerState?.taskId]);

  useEffect(() => {
    if (!workspaceId && visibleWorkspaces[0]) setWorkspaceId(visibleWorkspaces[0].id);
  }, [visibleWorkspaces, workspaceId]);

  const run = async (type: string, payload?: Record<string, unknown>, success = "Done") => {
    setMessage("Working…");
    const response = await sendExtensionMessage(type, payload);
    setMessage(response.ok ? success : response.error || "Something went wrong");
    window.setTimeout(() => setMessage(""), 2600);
  };

  return (
    <main className="min-h-screen bg-[#101916] px-4 py-5 text-white">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-emerald-300/80">FocusTab</div>
          <h1 className="mt-1 text-xl font-semibold">Stay with the work.</h1>
        </div>
        <button onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("index.html") })} className="rounded-xl bg-white/10 px-3 py-2 text-xs hover:bg-white/15">Dashboard</button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
        <div className="text-xs text-white/55">Current focus</div>
        {isRunning ? (
          <>
            <div className="mt-2 text-lg font-medium">{currentTask?.title || timerState?.title}</div>
            <div className="mt-3 font-mono text-4xl tracking-tight text-emerald-200">{formatTime(timeLeftSec)}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={isPaused ? resume : pause} className="flex-1 rounded-xl bg-emerald-400 px-3 py-2.5 text-sm font-semibold text-emerald-950">{isPaused ? "Resume" : "Pause"}</button>
              <button onClick={() => end(true)} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm">End</button>
            </div>
          </>
        ) : (
          <div className="mt-3 text-sm leading-6 text-white/65">No focus session is running. Start one from the new-tab dashboard.</div>
        )}
      </section>

      <section className="mt-4 space-y-2">
        <button onClick={() => run("saved.saveCurrent", undefined, "Page saved")} className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm hover:bg-white/10">＋ Save current page</button>
        <button onClick={() => run("blocking.addCurrent", { mode: "focus" }, "Site added to Focus blocklist")} className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm hover:bg-white/10">⊘ Block this site during focus</button>
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <label className="text-xs text-white/55">Add current page to workspace</label>
        <select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#18231f] px-3 py-2.5 text-sm outline-none">
          <option value="">Choose a workspace</option>
          {visibleWorkspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
        </select>
        <button disabled={!workspaceId} onClick={() => run("workspace.addCurrent", { workspaceId }, "Added to workspace")} className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm disabled:opacity-40">Add page</button>
      </section>

      {message && <div role="status" className="fixed bottom-4 left-4 right-4 rounded-xl bg-emerald-300 px-3 py-2 text-center text-sm font-medium text-emerald-950 shadow-xl">{message}</div>}
    </main>
  );
};

export default SidePanelApp;
