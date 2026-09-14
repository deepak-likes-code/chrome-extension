import React, { useMemo, useState } from "react";
import { Archive, BarChart3, BookOpen, BriefcaseBusiness, Brush, ChevronDown, ChevronRight, Grid2X2, Laptop, Leaf, MoreHorizontal, PanelTop, Plane, Play, Plus, Search, Star, Users, X } from "lucide-react";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { Workspace } from "../../types/Workspace";

const iconFor = (icon: Workspace["icon"], className = "h-6 w-6") => {
  const props = { className, strokeWidth: 1.8 };
  if (icon === "star") return <Star {...props}/>;
  if (icon === "leaf") return <Leaf {...props}/>;
  if (icon === "laptop") return <Laptop {...props}/>;
  if (icon === "plane") return <Plane {...props}/>;
  if (icon === "people") return <Users {...props}/>;
  return <BriefcaseBusiness {...props}/>;
};

const WorkspacesView: React.FC = () => {
  const { workspaces, visibleWorkspaces, stats, createWorkspace, saveCurrentTabs, resumeWorkspace, removeStoredTab, archiveWorkspace, renameWorkspace, changeWorkspaceIcon } = useWorkspaces();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"tabs" | "saved" | "notes">("tabs");
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState("");
  const [duplicates, setDuplicates] = useState<chrome.tabs.Tab[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = useMemo(() => visibleWorkspaces.filter((workspace) => workspace.name.toLowerCase().includes(query.trim().toLowerCase())), [visibleWorkspaces, query]);
  const selected = visibleWorkspaces.find((workspace) => workspace.id === (selectedId || visibleWorkspaces[0]?.id)) || visibleWorkspaces[0];
  React.useEffect(() => { if (!selectedId && visibleWorkspaces[0]) setSelectedId(visibleWorkspaces[0].id); }, [visibleWorkspaces, selectedId]);
  const flash = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2600); };
  const create = () => { const workspace = createWorkspace(newName); setSelectedId(workspace.id); setNewName(""); setCreating(false); flash(`Created “${workspace.name}”`); };
  const scan = () => chrome.tabs.query({ currentWindow: true }, (tabs) => { const seen = new Set<string>(); const found = tabs.filter((tab) => { if (!tab.url) return false; const clean = tab.url.replace(/#.*$/, "").replace(/\/$/, ""); if (seen.has(clean)) return true; seen.add(clean); return false; }); setDuplicates(found); if (!found.length) flash("No exact duplicate tabs found"); });
  const closeDuplicates = () => { const ids = duplicates.flatMap((tab) => tab.id == null ? [] : [tab.id]); if (!window.confirm(`Close ${ids.length} exact duplicate tab${ids.length === 1 ? "" : "s"}?`)) return; chrome.tabs.remove(ids); setDuplicates([]); flash(`Closed ${ids.length} duplicate tab${ids.length === 1 ? "" : "s"}`); };

  if (!selected) return (
    <div className="flex h-full items-center justify-center px-8 pt-20 text-white">
      <div className="glass-panel flex w-full max-w-[620px] items-center gap-5 p-5 text-left"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><BriefcaseBusiness className="h-6 w-6" strokeWidth={1.6}/></span><div className="min-w-0 flex-1"><div className="eyebrow">Workspaces</div><h1 className="screen-title mt-1 text-xl">Save your first browser context.</h1><p className="mt-1 text-[13px] text-white/50">Keep one project’s tabs together and reopen them in a click.</p>{creating && <div className="mt-3 flex max-w-sm gap-2"><input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="Workspace name" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm outline-none"/><button onClick={create} className="mint-button px-4 text-sm">Create</button></div>}</div>{!creating && <button onClick={() => setCreating(true)} className="mint-button shrink-0 px-4 py-2.5 text-sm">Create</button>}{workspaces.some((workspace) => workspace.archived) && <button onClick={() => archiveWorkspace(workspaces.find((workspace) => workspace.archived)!.id, false)} className="shrink-0 text-xs text-white/55">Restore archived</button>}</div>
    </div>
  );

  const workspaceColors: Record<Workspace["icon"], string> = { briefcase: "bg-emerald-300/15 text-emerald-200", star: "bg-purple-400/15 text-purple-300", leaf: "bg-green-300/15 text-emerald-200", laptop: "bg-blue-300/15 text-blue-200", plane: "bg-rose-300/15 text-rose-300", people: "bg-orange-300/15 text-orange-200" };
  const statItems = [
    { label: "Total Workspaces", value: stats.totalWorkspaces, Icon: Grid2X2 },
    { label: "Open Tabs", value: stats.openTabs, Icon: PanelTop },
    { label: "Archived Tabs", value: stats.archivedTabs, Icon: Archive },
    { label: "Recovered Focus Time", value: stats.recoveredTime, Icon: BarChart3 },
  ];

  return (
    <div className="reference-responsive h-full overflow-y-auto px-8 pb-20 pt-[105px] custom-scrollbar">
      <div className="mx-auto grid w-full max-w-[1360px] grid-cols-[minmax(0,1fr)_440px] gap-12 max-[1100px]:grid-cols-1">
        <section className="min-w-0 pt-3">
          <div className="eyebrow">Organize your digital life</div>
          <h1 className="screen-title mt-2 text-[44px] leading-[1.05]">Workspaces for a clearer mind.</h1>
          <p className="mt-2 text-[16px] text-white/55">Keep each project’s tabs together and return when you’re ready.</p>
          <div className="mt-7 grid grid-cols-[1fr_auto_auto] gap-3">
            <label className="glass-panel flex h-[52px] items-center gap-3 px-4"><Search className="h-4.5 w-4.5 text-white/70"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search workspaces…" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-white/40"/></label>
            {creating ? <div className="glass-panel flex h-[52px] items-center gap-2 px-3"><input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setCreating(false); }} placeholder="Workspace name" className="w-36 bg-transparent text-sm outline-none"/><button onClick={create} className="text-sm text-emerald-200">Save</button></div> : <button onClick={() => setCreating(true)} className="mint-button flex h-[52px] items-center gap-2 px-5 text-[13px]"><Plus className="h-4 w-4"/>New</button>}
            <button onClick={scan} aria-label="Clean inactive tabs" title="Clean inactive tabs" className="glass-panel flex h-[52px] w-[52px] items-center justify-center"><Brush className="h-4.5 w-4.5"/></button>
          </div>
          {duplicates.length > 0 && <div className="glass-panel mt-3 flex items-center gap-3 px-4 py-3 text-sm"><span className="flex-1">Found {duplicates.length} exact duplicate tab{duplicates.length === 1 ? "" : "s"}.</span><button onClick={closeDuplicates} className="rounded-lg bg-emerald-300/20 px-3 py-1.5 text-emerald-100">Close duplicates</button><button onClick={() => setDuplicates([])}><X className="h-4 w-4"/></button></div>}
          {notice && <div role="status" className="mt-2 text-xs text-emerald-200">{notice}</div>}

          <div className="mt-7 grid grid-cols-2 gap-4 max-[720px]:grid-cols-1">
            {filtered.map((workspace) => <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`glass-panel flex min-h-[112px] items-center gap-4 p-4 text-left transition ${workspace.id === selected.id ? "!border-emerald-300 ring-1 ring-emerald-300/70 !bg-emerald-900/25" : "hover:border-white/30"}`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${workspaceColors[workspace.icon]}`}>{iconFor(workspace.icon, "h-6 w-6")}</span><span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold">{workspace.name}</span><span className="mt-1 block text-[12px] text-white/60">{workspace.tabs.length} tabs</span><span className="mt-1.5 block truncate text-[11px] text-white/42">{workspace.lastActive}</span></span><ChevronRight className="h-4 w-4 text-white/45"/></button>)}
          </div>
          {!filtered.length && <div className="mt-7 flex items-center justify-between rounded-xl bg-black/15 px-4 py-3 text-sm text-white/50"><span>No workspaces match “{query}”.</span><button onClick={() => setQuery("")} className="text-emerald-200">Clear search</button></div>}
          {workspaces.some((workspace) => workspace.archived) && <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50"><span>Archived:</span>{workspaces.filter((workspace) => workspace.archived).map((workspace) => <button key={workspace.id} onClick={() => archiveWorkspace(workspace.id, false)} className="rounded-full bg-white/10 px-3 py-1">Restore {workspace.name}</button>)}</div>}
        </section>

        <aside className="glass-panel flex h-fit flex-col p-6">
          <div className="flex items-center gap-4"><span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${workspaceColors[selected.icon]}`}>{iconFor(selected.icon, "h-7 w-7")}</span><div className="min-w-0 flex-1">{editingName ? <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} onBlur={() => { renameWorkspace(selected.id, nameDraft); setEditingName(false); }} onKeyDown={(e) => e.key === "Enter" && (renameWorkspace(selected.id, nameDraft), setEditingName(false))} className="w-full border-b border-white/30 bg-transparent text-[22px] font-semibold outline-none"/> : <button onClick={() => { setNameDraft(selected.name); setEditingName(true); }} className="truncate text-left text-[22px] font-semibold">{selected.name}</button>}<div className="mt-1 text-[12px] text-white/55">{selected.tabs.length} tabs &nbsp;•&nbsp; {selected.lastActive.replace("Last active • ", "Last active ")}</div></div><div className="relative"><button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl bg-white/[0.07] p-2.5"><MoreHorizontal className="h-4 w-4"/></button>{menuOpen && <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-white/15 bg-[#1e2923] p-1.5 shadow-2xl"><button onClick={() => { saveCurrentTabs(selected.id); setMenuOpen(false); flash("Current tabs saved"); }} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-white/10">Save current tabs</button><button onClick={() => { archiveWorkspace(selected.id, true); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs text-amber-100 hover:bg-white/10">Archive workspace</button></div>}</div></div>
          <div className="mt-3 flex gap-1">{(["briefcase","star","leaf","laptop","plane","people"] as const).map((icon) => <button key={icon} onClick={() => changeWorkspaceIcon(selected.id, icon)} aria-label={`Use ${icon} icon`} className={`flex h-7 w-7 items-center justify-center rounded-lg ${selected.icon === icon ? "bg-emerald-300/20 text-emerald-200 ring-1 ring-emerald-300/60" : "text-white/38 hover:bg-white/[0.05] hover:text-white/60"}`}>{iconFor(icon, "h-3.5 w-3.5")}</button>)}</div>
          <div className="mt-4 grid grid-cols-3 rounded-xl bg-black/15 p-1">{(["tabs","saved","notes"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-[9px] px-2 py-2.5 text-[12px] capitalize ${tab === item ? "bg-emerald-300/20 text-white" : "text-white/55"}`}>{item} ({item === "tabs" ? selected.tabs.length : item === "saved" ? selected.savedCount : selected.notesCount})</button>)}</div>
          {tab === "tabs" ? selected.tabs.length ? <ul className="custom-scrollbar mt-3 max-h-[310px] divide-y divide-white/[0.08] overflow-y-auto rounded-xl bg-black/[0.12]">{selected.tabs.slice(0, 7).map((savedTab) => <li key={savedTab.id} className="flex items-center gap-3 px-3 py-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-semibold">{savedTab.title.charAt(0).toUpperCase()}</span><button onClick={() => chrome.tabs.create({ url: savedTab.url })} className="min-w-0 flex-1 text-left"><span className="block truncate text-[13px]">{savedTab.title}</span><span className="block truncate text-[11px] text-white/45">{savedTab.domain}</span></button><button onClick={() => removeStoredTab(selected.id, savedTab.id)} aria-label={`Remove ${savedTab.title}`}><X className="h-3.5 w-3.5 text-white/55"/></button></li>)}</ul> : <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/[0.12] px-4 py-3 text-[12px] text-white/50"><span className="flex-1">No tabs saved yet.</span><button onClick={() => { saveCurrentTabs(selected.id); flash("Current tabs saved"); }} className="text-emerald-200">Save current tabs</button></div> : <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/[0.12] px-4 py-3 text-[12px] text-white/50">{tab === "saved" ? <><BookOpen className="h-4 w-4"/><span>No saved pages in this workspace.</span></> : "No notes yet."}</div>}
          {selected.tabs.length > 7 && <div className="mt-3 flex items-center gap-2 px-3 text-[13px] text-white/55"><Plus className="h-4 w-4"/>{selected.tabs.length - 7} more tabs<ChevronDown className="h-4 w-4"/></div>}
          <button onClick={() => { resumeWorkspace(selected.id); flash(`Resuming “${selected.name}”…`); }} disabled={!selected.tabs.length} className="mint-button mt-4 flex h-[50px] items-center justify-center gap-2 text-[14px] disabled:opacity-40"><Play className="h-4 w-4 fill-current"/>Resume Workspace</button>
        </aside>
      </div>
      <section className="mx-auto mt-7 flex w-full max-w-[1120px] items-center justify-center gap-12 text-white/55">{statItems.map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-3"><Icon className="h-5 w-5" strokeWidth={1.7}/><div><div className="text-[10px] uppercase tracking-wide text-white/35">{label}</div><div className="text-[15px] font-semibold text-white/75">{value}</div></div></div>)}</section>
    </div>
  );
};

export default WorkspacesView;
