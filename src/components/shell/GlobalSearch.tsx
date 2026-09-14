import React, { useEffect, useMemo, useRef, useState } from "react";
import { Globe2, Search } from "lucide-react";
import { AppTab } from "../../types/Focus";
import { SearchResult, SearchResultKind, sendExtensionMessage } from "../../types/Messages";

interface GlobalSearchProps { open?: boolean; onOpenChange?: (open: boolean) => void; onNavigate?: (tab: AppTab) => void; compact?: boolean; }

const LABELS: Record<SearchResultKind, string> = { tab: "Open tabs", history: "History", bookmark: "Bookmarks", saved: "Saved", task: "Tasks", workspace: "Workspaces", recent: "Recently closed" };

function navigationChoice(input: string) {
  const value = input.trim();
  if (!value) return null;
  const isWebsite = /^https?:\/\//i.test(value) || /^(localhost|(?:\d{1,3}\.){3}\d{1,3}|(?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#].*)?$/i.test(value);
  const url = /^https?:\/\//i.test(value)
    ? value
    : isWebsite
      ? `${value.startsWith("localhost") ? "http" : "https"}://${value}`
      : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  return {
    url,
    label: isWebsite ? `Open ${value.replace(/^https?:\/\//i, "")}` : `Search the web for “${value}”`,
    detail: isWebsite ? "Go directly to this website" : "Open results in Google",
  };
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ open: controlledOpen, onOpenChange, onNavigate, compact }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => { setInternalOpen(value); onOpenChange?.(value); };
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(!open); }
      if (event.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => input.current?.focus(), 20);
    setLoading(true);
    const timeout = window.setTimeout(() => {
      sendExtensionMessage<SearchResult[]>("search.all", { query }).then((response) => {
        setResults(response.ok && response.data ? response.data : []);
        setLoading(false);
        setSelected(query.trim() ? -1 : 0);
      });
    }, 90);
    return () => window.clearTimeout(timeout);
  }, [open, query]);

  const groups = useMemo(() => {
    const map = new Map<SearchResultKind, SearchResult[]>();
    results.forEach((result) => map.set(result.kind, [...(map.get(result.kind) || []), result]));
    return Array.from(map.entries());
  }, [results]);

  const directNavigation = useMemo(() => navigationChoice(query), [query]);

  const pick = async (result: SearchResult) => {
    if (result.kind === "task") { await chrome.storage.local.set({ pendingFocusTaskId: result.taskId }); onNavigate?.("focus"); setOpen(false); return; }
    await sendExtensionMessage("search.open", { result });
    setOpen(false);
  };

  const navigate = async () => {
    if (!directNavigation) return;
    try {
      await chrome.tabs.create({ url: directNavigation.url, active: true });
      setOpen(false);
    } catch {
      window.open(directNavigation.url, "_blank", "noopener,noreferrer");
      setOpen(false);
    }
  };
  const command = async (name: string) => {
    if (name === "focus") onNavigate?.("focus");
    if (name === "workspace") onNavigate?.("workspaces");
    if (name === "insights") onNavigate?.("insights");
    if (name === "saved") onNavigate?.("saved");
    if (name === "duplicates") {
      const health = await sendExtensionMessage<any>("tabs.health");
      if (health.ok && health.data?.duplicateTabIds?.length && window.confirm(`Close ${health.data.duplicateTabIds.length} exact duplicate tabs?`)) await sendExtensionMessage("tabs.close", { tabIds: health.data.duplicateTabIds });
    }
    if (name === "task") {
      const title = window.prompt("What do you want to get done?")?.trim();
      if (title) {
        const data = await chrome.storage.local.get(["focusTasks"]);
        const tasks = Array.isArray(data.focusTasks) ? data.focusTasks : [];
        tasks.push({ id: `task-${Date.now()}`, title, status: "todo", createdAt: new Date().toISOString(), completedAt: null });
        await chrome.storage.local.set({ focusTasks: tasks });
        onNavigate?.("focus");
      }
    }
    if (name === "save") await sendExtensionMessage("saved.saveCurrent");
    if (name === "block") {
      const granted = await chrome.permissions.request({ origins: ["http://*/*", "https://*/*"] });
      if (granted) await sendExtensionMessage("blocking.addCurrent", { mode: "focus" });
    }
    setOpen(false);
  };

  if (!open) {
    if (compact) return <button onClick={() => setOpen(true)} className="glass-pill pointer-events-auto flex h-[52px] w-[min(580px,calc(100vw-40px))] items-center gap-4 px-6 text-[13px] text-white/65 hover:border-white/25"><Search className="h-5 w-5" strokeWidth={1.8}/><span className="flex-1 text-left">Search or open a website…</span><span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px]">⌘ K</span></button>;
    if (controlledOpen !== undefined) return null;
    return <button onClick={() => setOpen(true)} className="pointer-events-auto flex w-[440px] items-center gap-3 rounded-full border border-white/15 bg-black/40 px-5 py-3 backdrop-blur-[24px]"><Search className="h-5 w-5"/><span className="flex-1 text-left text-sm text-white/60">Search or open a website…</span><span className="rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/60">⌘ K</span></button>;
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[80] flex items-start justify-center bg-black/65 px-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="w-full max-w-[720px] overflow-hidden rounded-[24px] border border-white/15 bg-[#15211d]/95 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><Search className="h-5 w-5 text-white/60"/><input ref={input} value={query} onChange={(e) => { setQuery(e.target.value); setSelected(-1); }} onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setSelected((value) => Math.min(results.length - 1, value + 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setSelected((value) => Math.max(directNavigation ? -1 : 0, value - 1)); } if (e.key === "Enter") { if (selected === -1 && directNavigation) navigate(); else if (results[selected]) pick(results[selected]); } }} placeholder="Search your browser or open a website…" className="flex-1 bg-transparent text-lg text-white outline-none placeholder:text-white/35"/><span className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/45">esc</span></div>
        <div className="max-h-[58vh] overflow-y-auto p-3 custom-scrollbar">
          {!query && <div><div className="px-2 py-2 text-[11px] uppercase tracking-widest text-white/35">Commands</div><div className="grid grid-cols-2 gap-2">{[["focus","Start focus"],["task","Create task"],["workspace","Open workspace"],["saved","Browse saved"],["save","Save current page"],["block","Block current site"],["duplicates","Close duplicates"],["insights","View insights"]].map(([id,label]) => <button key={id} onClick={() => command(id)} className="rounded-xl bg-white/[0.05] px-3 py-3 text-left text-sm text-white/75 hover:bg-white/10">{label}</button>)}</div></div>}
          {directNavigation && <button onMouseEnter={() => setSelected(-1)} onClick={navigate} className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${selected === -1 ? "border-emerald-200/25 bg-emerald-300/15" : "border-white/[0.06] bg-white/[0.035] hover:bg-white/[0.07]"}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200"><Globe2 className="h-[18px] w-[18px]"/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/90">{directNavigation.label}</span><span className="mt-0.5 block text-xs text-white/40">{directNavigation.detail}</span></span><span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] text-white/40">enter</span></button>}
          {loading && <div className="px-3 py-8 text-center text-sm text-white/45">Searching this browser…</div>}
          {!loading && groups.map(([kind, items]) => <section key={kind} className="mt-3"><div className="px-2 py-1 text-[11px] uppercase tracking-widest text-white/35">{LABELS[kind]}</div>{items.map((result) => { const index = results.indexOf(result); return <button key={result.id} onMouseEnter={() => setSelected(index)} onClick={() => pick(result)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${selected === index ? "bg-emerald-300/15" : "hover:bg-white/5"}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs uppercase">{result.kind.slice(0,2)}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/90">{result.title}</span><span className="block truncate text-xs text-white/40">{result.subtitle || result.url}</span></span><span className="text-white/30">↗</span></button>; })}</section>)}
          {!loading && query && results.length === 0 && <div className="px-3 py-5 text-center"><div className="text-xs text-white/35">No matching tabs or saved browser items. You can still open the website or search the web above.</div></div>}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/35"><span>Web · tabs · tasks · workspaces · saved · history · bookmarks</span><span>↑↓ navigate · enter open</span></div>
      </div>
    </div>
  );
};

export default GlobalSearch;
