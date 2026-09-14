import React, { useEffect, useState } from "react";
import { Check, ChevronDown, Palette, Search, ShieldBan, Trash2, X } from "lucide-react";
import { sendExtensionMessage } from "../../types/Messages";

interface SettingsModalProps { open: boolean; onClose: () => void; onShuffle: () => void; }
type PermissionName = "history" | "bookmarks" | "browsingData";

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, onShuffle }) => {
  const [granted, setGranted] = useState<Record<string, boolean>>({});
  const [rules, setRules] = useState<any[]>([]);
  const [domain, setDomain] = useState("");
  const [mode, setMode] = useState("focus");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [temporaryMinutes, setTemporaryMinutes] = useState("60");
  const [notice, setNotice] = useState("");

  const refresh = () => {
    (["history", "bookmarks", "browsingData"] as PermissionName[]).forEach((permission) => chrome.permissions.contains({ permissions: [permission] }, (yes) => setGranted((prev) => ({ ...prev, [permission]: yes }))));
    chrome.permissions.contains({ origins: ["http://*/*", "https://*/*"] }, (yes) => setGranted((prev) => ({ ...prev, hosts: yes })));
    chrome.storage.local.get(["blockRules"], (data) => setRules(Array.isArray(data.blockRules) ? data.blockRules : []));
  };
  useEffect(() => { if (open) refresh(); }, [open]);
  if (!open) return null;

  const request = (permission: PermissionName) => chrome.permissions.request({ permissions: [permission] }, (yes) => { refresh(); setNotice(yes ? "Permission enabled" : "Nothing changed"); });
  const requestHosts = () => chrome.permissions.request({ origins: ["http://*/*", "https://*/*"] }, (yes) => { refresh(); if (yes) sendExtensionMessage("blocking.sync"); setNotice(yes ? "Website blocking enabled" : "Nothing changed"); });
  const addRule = async () => {
    if (!granted.hosts) { requestHosts(); return; }
    const response = await sendExtensionMessage("blocking.add", { domain, mode, startTime, endTime, until: Number(temporaryMinutes) });
    setNotice(response.ok ? (mode === "allow" ? "Added to allowlist" : "Blocking rule added") : response.error || "Could not add site");
    if (response.ok) { setDomain(""); refresh(); }
  };
  const removeRule = (id: string) => {
    const next = rules.filter((rule) => rule.id !== id);
    chrome.storage.local.set({ blockRules: next }, () => { setRules(next); sendExtensionMessage("blocking.sync"); });
  };
  const clear = (type: "cache" | "history" | "cookies") => {
    if (!granted.browsingData) { request("browsingData"); return; }
    const warning = type === "cookies" ? "This signs you out of websites from the last 24 hours. Continue?" : `Clear ${type} from the last 24 hours?`;
    if (!window.confirm(warning)) return;
    sendExtensionMessage("browsingData.clear", { [type]: true, since: Date.now() - 24 * 60 * 60 * 1000 }).then((response) => setNotice(response.ok ? `${type} cleared` : response.error || "Could not clear data"));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass-panel max-h-[82vh] w-full max-w-[680px] overflow-y-auto p-5 custom-scrollbar">
        <div className="flex items-center justify-between"><div><div className="eyebrow">Local-first controls</div><h2 className="mt-1 text-[22px] font-semibold">Settings</h2></div><button onClick={onClose} aria-label="Close settings" className="rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white"><X className="h-5 w-5"/></button></div>

        <section className="mt-4 flex items-center gap-4 rounded-xl bg-white/[0.04] px-4 py-3">
          <Palette className="h-5 w-5 text-emerald-200"/>
          <div className="min-w-0 flex-1"><h3 className="text-sm font-medium">Scenic background</h3><p className="text-xs text-white/45">Cycle through the curated collection.</p></div>
          <button onClick={onShuffle} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Change</button>
        </section>

        <div className="mt-3 divide-y divide-white/10 rounded-xl bg-white/[0.025] px-4">
          <details className="settings-disclosure group py-1">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3"><Search className="h-4.5 w-4.5 text-white/65"/><span className="flex-1 text-sm font-medium">Browser search sources</span><span className="text-xs text-white/40">Optional</span><ChevronDown className="h-4 w-4 text-white/45 transition group-open:rotate-180"/></summary>
            <div className="pb-4 pl-8"><p className="text-xs leading-5 text-white/45">Tabs, tasks and workspaces work automatically. Enable extra sources only when useful.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => request("history")} className="flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-xs">{granted.history && <Check className="h-3.5 w-3.5 text-emerald-200"/>}{granted.history ? "History enabled" : "Enable history"}</button><button onClick={() => request("bookmarks")} className="flex items-center gap-2 rounded-lg bg-white/[0.08] px-3 py-2 text-xs">{granted.bookmarks && <Check className="h-3.5 w-3.5 text-emerald-200"/>}{granted.bookmarks ? "Bookmarks enabled" : "Enable bookmarks"}</button></div></div>
          </details>

          <details className="settings-disclosure group py-1">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3"><ShieldBan className="h-4.5 w-4.5 text-white/65"/><span className="flex-1 text-sm font-medium">Website blocking</span><span className="text-xs text-white/40">{rules.length ? `${rules.length} rules` : "No rules"}</span><ChevronDown className="h-4 w-4 text-white/45 transition group-open:rotate-180"/></summary>
            <div className="pb-4 pl-8"><div className="flex items-center justify-between gap-4"><p className="text-xs leading-5 text-white/45">Focus, scheduled, temporary and allowlist rules.</p><button onClick={requestHosts} className="shrink-0 rounded-lg bg-emerald-300/15 px-3 py-2 text-xs text-emerald-100">{granted.hosts ? "Enabled" : "Enable"}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRule()} placeholder="reddit.com" className="min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"/><select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-lg border border-white/10 bg-[#18231f] px-3 py-2 text-xs outline-none"><option value="focus">During focus</option><option value="always">Always block</option><option value="schedule">Schedule</option><option value="temporary">Temporary</option><option value="allow">Always allow</option></select><button onClick={addRule} className="rounded-lg bg-white/10 px-3 py-2 text-xs">Add</button></div>{mode === "schedule" && <div className="mt-2 flex items-center gap-2 text-xs text-white/55"><span>Weekdays</span><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-lg bg-black/25 px-2 py-1.5"/><span>to</span><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-lg bg-black/25 px-2 py-1.5"/></div>}{mode === "temporary" && <div className="mt-2 flex items-center gap-2 text-xs text-white/55"><span>Block for</span><input value={temporaryMinutes} onChange={(e) => setTemporaryMinutes(e.target.value.replace(/\D/g, ""))} className="w-20 rounded-lg bg-black/25 px-2 py-1.5"/><span>minutes</span></div>}{rules.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{rules.map((rule) => <span key={rule.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${rule.mode === "allow" ? "bg-blue-300/15 text-blue-100" : "bg-white/10"}`}>{rule.domain} · {rule.mode}{rule.mode === "schedule" ? ` ${rule.startTime}–${rule.endTime}` : ""}<button onClick={() => removeRule(rule.id)} aria-label={`Remove ${rule.domain}`} className="text-white/45 hover:text-white"><X className="h-3 w-3"/></button></span>)}</div>}</div>
          </details>

          <details className="settings-disclosure group py-1">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3"><Trash2 className="h-4.5 w-4.5 text-white/65"/><span className="flex-1 text-sm font-medium">Browser cleanup</span><span className="text-xs text-white/40">Explicit only</span><ChevronDown className="h-4 w-4 text-white/45 transition group-open:rotate-180"/></summary>
            <div className="pb-4 pl-8"><p className="text-xs leading-5 text-white/45">Clearing cookies can sign you out, so FocusTab always warns first.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => clear("cache")} className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs">Clear 24h cache</button><button onClick={() => clear("history")} className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs">Clear 24h history</button><button onClick={() => clear("cookies")} className="rounded-lg border border-amber-200/15 bg-amber-200/[0.08] px-3 py-2 text-xs text-amber-100">Clear 24h cookies</button></div></div>
          </details>
        </div>

        <p className="mt-4 text-[11px] text-white/40">No account required. Your tasks, workspaces and analytics stay in Brave’s local extension storage.</p>
        {notice && <div role="status" className="mt-3 rounded-xl bg-emerald-300/20 px-3 py-2 text-sm text-emerald-100">{notice}</div>}
      </div>
    </div>
  );
};

export default SettingsModal;
