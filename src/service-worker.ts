import { BrowserHealth, FocusStartPayload, SearchResult } from "./types/Messages";
import { FocusSessionRecord, FocusTask } from "./types/Focus";
import { TimerState } from "./types/Timer";
import { Workspace } from "./types/Workspace";

const TIMER_ALARM = "focustab-session-end";
const FOCUS_RULE_START = 2000;
const PERMANENT_RULE_START = 1000;
const ALLOW_RULE_START = 3000;
const MAX_RESULTS_PER_KIND = 8;

type StoredBlockRule = {
  id: string;
  domain: string;
  enabled: boolean;
  mode: "always" | "focus" | "schedule" | "temporary" | "allow";
  startTime?: string;
  endTime?: string;
  days?: number[];
  until?: number;
};

type RestoreTab = { id: number; groupId: number; active: boolean; pinned: boolean };
type FocusRestoreState = {
  sessionId: string;
  windowId: number;
  tabs: RestoreTab[];
  temporaryGroupIds: number[];
  groups: Array<{ id: number; collapsed: boolean }>;
};

let endingFocus: Promise<{ restored: boolean }> | null = null;

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function storageGet(keys: string[]): Promise<Record<string, any>> {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(values: Record<string, any>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(values, () => resolve()));
}

function storageRemove(keys: string[]): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.remove(keys, () => resolve()));
}

function queryTabs(query: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => chrome.tabs.query(query, resolve));
}

function domainOf(url = "") {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function canonicalUrl(url = "") {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (/^(utm_|fbclid|gclid|ref$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function isWebUrl(url = "") {
  return /^https?:\/\//i.test(url);
}

function words(value = "") {
  return value.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function scoreText(query: string, ...values: string[]) {
  const haystack = values.join(" ").toLowerCase();
  const terms = words(query);
  if (!terms.length) return 1;
  if (!terms.every((term) => haystack.includes(term))) return 0;
  const exact = values.some((value) => value.toLowerCase().startsWith(query.toLowerCase()));
  return exact ? 100 : 50;
}

function permissionContains(permissions: string[]): Promise<boolean> {
  return new Promise((resolve) => chrome.permissions.contains({ permissions }, resolve));
}

function hostAccessGranted(): Promise<boolean> {
  return new Promise((resolve) =>
    chrome.permissions.contains({ origins: ["http://*/*", "https://*/*"] }, resolve)
  );
}

function dnrUpdateDynamic(removeRuleIds: number[], addRules: chrome.declarativeNetRequest.Rule[]) {
  return new Promise<void>((resolve, reject) => {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules }, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function dnrUpdateSession(removeRuleIds: number[], addRules: chrome.declarativeNetRequest.Rule[]) {
  return new Promise<void>((resolve, reject) => {
    chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds, addRules }, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function ruleForDomain(domain: string, id: number, priority = 1): chrome.declarativeNetRequest.Rule {
  const redirect = `${chrome.runtime.getURL("blocked.html")}?blocked=`;
  return {
    id,
    priority,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: { regexSubstitution: `${redirect}\\0` },
    },
    condition: {
      regexFilter: `^https?://([^/]+\\.)?${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`,
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  };
}

function allowRuleForDomain(domain: string, id: number): chrome.declarativeNetRequest.Rule {
  return {
    id,
    priority: 100,
    action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
    condition: { requestDomains: [domain], resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME] },
  };
}

function isRuleActive(rule: StoredBlockRule, focusActive: boolean) {
  if (!rule.enabled) return false;
  if (rule.mode === "allow") return true;
  if (rule.mode === "always") return true;
  if (rule.mode === "focus") return focusActive;
  if (rule.mode === "temporary") return !!rule.until && rule.until > Date.now();
  if (rule.mode === "schedule") {
    const now = new Date();
    if (rule.days?.length && !rule.days.includes(now.getDay())) return false;
    const current = now.getHours() * 60 + now.getMinutes();
    const parse = (value = "00:00") => {
      const [h, m] = value.split(":").map(Number);
      return h * 60 + m;
    };
    const start = parse(rule.startTime);
    const end = parse(rule.endTime || "23:59");
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
  }
  return false;
}

async function getBlockRules(): Promise<StoredBlockRule[]> {
  const data = await storageGet(["blockRules", "blocklist"]);
  if (Array.isArray(data.blockRules)) return data.blockRules;
  const legacy: string[] = Array.isArray(data.blocklist) ? data.blocklist : [];
  const migrated = legacy
    .map(domainOf)
    .filter(Boolean)
    .map((domain) => ({ id: uid("rule"), domain, enabled: true, mode: "focus" as const }));
  await storageSet({ blockRules: migrated });
  return migrated;
}

async function syncBlockingRules() {
  const data = await storageGet(["timerState"]);
  const focusActive = data.timerState?.status === "focus";
  const hasHostAccess = await hostAccessGranted();
  const rules = await getBlockRules();
  const existingDynamic = await chrome.declarativeNetRequest.getDynamicRules();
  const existingSession = await chrome.declarativeNetRequest.getSessionRules();
  const dynamicIds = existingDynamic.filter((r) => r.id >= PERMANENT_RULE_START && r.id < FOCUS_RULE_START).map((r) => r.id);
  const sessionIds = existingSession.filter((r) => r.id >= FOCUS_RULE_START && r.id < ALLOW_RULE_START).map((r) => r.id);
  if (!hasHostAccess) {
    await Promise.all([dnrUpdateDynamic(dynamicIds, []), dnrUpdateSession(sessionIds, [])]);
    return { activeCount: 0, permissionNeeded: rules.some((r) => r.enabled) };
  }
  const always = rules.filter((r) => isRuleActive(r, focusActive) && r.mode !== "focus");
  const focus = rules.filter((r) => isRuleActive(r, focusActive) && r.mode === "focus");
  await Promise.all([
    dnrUpdateDynamic(dynamicIds, always.map((r, i) => r.mode === "allow" ? allowRuleForDomain(r.domain, PERMANENT_RULE_START + i) : ruleForDomain(r.domain, PERMANENT_RULE_START + i))),
    dnrUpdateSession(sessionIds, focus.map((r, i) => ruleForDomain(r.domain, FOCUS_RULE_START + i))),
  ]);
  return { activeCount: always.length + focus.length, permissionNeeded: false };
}

async function browserHealth(): Promise<BrowserHealth> {
  const tabs = (await queryTabs({ currentWindow: true })).filter((t) => t.id != null && isWebUrl(t.url));
  const seen = new Set<string>();
  const duplicateTabIds: number[] = [];
  const now = Date.now();
  const staleTabs = tabs
    .filter((tab) => {
      const value = canonicalUrl(tab.url);
      if (seen.has(value)) duplicateTabIds.push(tab.id!);
      else seen.add(value);
      const lastAccessed = (tab as any).lastAccessed as number | undefined;
      return !!lastAccessed && now - lastAccessed > 7 * 24 * 60 * 60 * 1000 && !tab.pinned;
    })
    .map((tab) => ({
      id: tab.id!,
      title: tab.title || tab.url || "Untitled",
      url: tab.url || "",
      domain: domainOf(tab.url),
      lastAccessed: (tab as any).lastAccessed,
    }));
  const domains = new Map<string, number[]>();
  tabs.forEach((tab) => {
    const domain = domainOf(tab.url);
    if (!domain) return;
    const key = domain.split(".").slice(-2).join(".");
    domains.set(key, [...(domains.get(key) || []), tab.id!]);
  });
  const suggestedGroups = Array.from(domains.entries())
    .filter(([, ids]) => ids.length >= 2)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([name, tabIds]) => ({ name, tabIds, count: tabIds.length }));
  return {
    openCount: tabs.length,
    duplicateCount: duplicateTabIds.length,
    staleCount: staleTabs.length,
    duplicateTabIds,
    staleTabs,
    suggestedGroups,
  };
}

async function searchAll(query: string): Promise<SearchResult[]> {
  const data = await storageGet(["focusTasks", "workspaces", "savedItems"]);
  const results: SearchResult[] = [];
  const tabs = await queryTabs({});
  tabs.forEach((tab) => {
    const score = scoreText(query, tab.title || "", tab.url || "");
    if (score && tab.id != null) results.push({ id: `tab-${tab.id}`, kind: "tab", title: tab.title || "Untitled tab", subtitle: domainOf(tab.url), url: tab.url, tabId: tab.id, score: score + 20 });
  });
  const tasks: FocusTask[] = Array.isArray(data.focusTasks) ? data.focusTasks : [];
  tasks.forEach((task) => {
    const score = scoreText(query, task.title);
    if (score) results.push({ id: `task-${task.id}`, kind: "task", title: task.title, subtitle: task.status === "done" ? "Completed task" : "Task", taskId: task.id, score });
  });
  const workspaces: Workspace[] = Array.isArray(data.workspaces) ? data.workspaces : [];
  workspaces.filter((w) => !w.archived).forEach((workspace) => {
    const score = scoreText(query, workspace.name, ...workspace.tabs.map((t) => `${t.title} ${t.domain}`));
    if (score) results.push({ id: `workspace-${workspace.id}`, kind: "workspace", title: workspace.name, subtitle: `${workspace.tabs.length} saved tabs`, workspaceId: workspace.id, score: score + 10 });
  });
  const saved: any[] = Array.isArray(data.savedItems) ? data.savedItems : [];
  saved.forEach((item) => {
    const score = scoreText(query, item.title || "", item.url || "");
    if (score) results.push({ id: `saved-${item.id}`, kind: "saved", title: item.title || item.url, subtitle: domainOf(item.url), url: item.url, score });
  });
  if (await permissionContains(["history"])) {
    const history = await chrome.history.search({ text: query, startTime: 0, maxResults: 40 });
    history.forEach((item) => results.push({ id: `history-${item.id}`, kind: "history", title: item.title || item.url || "History result", subtitle: domainOf(item.url), url: item.url, score: scoreText(query, item.title || "", item.url || "") }));
  }
  if (await permissionContains(["bookmarks"])) {
    const bookmarks = query.trim() ? await chrome.bookmarks.search(query) : [];
    bookmarks.filter((b) => b.url).forEach((item) => results.push({ id: `bookmark-${item.id}`, kind: "bookmark", title: item.title || item.url || "Bookmark", subtitle: domainOf(item.url), url: item.url, score: 55 }));
  }
  const recentlyClosed = await chrome.sessions.getRecentlyClosed({ maxResults: 12 });
  recentlyClosed.forEach((entry, index) => {
    const tab = entry.tab;
    if (!tab?.url) return;
    const score = scoreText(query, tab.title || "", tab.url);
    if (score) results.push({ id: `recent-${index}-${tab.sessionId || "tab"}`, kind: "recent", title: tab.title || tab.url, subtitle: "Recently closed", url: tab.url, score });
  });
  const counts: Record<string, number> = {};
  return results
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .filter((item) => {
      counts[item.kind] = (counts[item.kind] || 0) + 1;
      return counts[item.kind] <= MAX_RESULTS_PER_KIND;
    })
    .slice(0, 36);
}

async function activateSearchResult(result: SearchResult) {
  if (result.tabId != null) {
    const tab = await chrome.tabs.get(result.tabId);
    if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(result.tabId, { active: true });
    return;
  }
  if (result.workspaceId) {
    await resumeWorkspace(result.workspaceId);
    return;
  }
  if (result.url) await chrome.tabs.create({ url: result.url, active: true });
}

async function resumeWorkspace(workspaceId: string) {
  const data = await storageGet(["workspaces"]);
  const workspaces: Workspace[] = Array.isArray(data.workspaces) ? data.workspaces : [];
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  const existing = await queryTabs({ currentWindow: true });
  const urls = new Set(existing.map((tab) => canonicalUrl(tab.url)));
  for (const saved of workspace.tabs.slice(0, 50)) {
    if (isWebUrl(saved.url) && !urls.has(canonicalUrl(saved.url))) {
      await chrome.tabs.create({ url: saved.url, active: false });
    }
  }
  workspace.lastActiveAt = new Date().toISOString();
  workspace.updatedAt = workspace.lastActiveAt;
  await storageSet({ workspaces, lastWorkspaceId: workspaceId });
  return workspace;
}

async function restoreFocusTabs() {
  const data = await storageGet(["activeFocusRestore"]);
  const restore = data.activeFocusRestore as FocusRestoreState | undefined;
  if (!restore) return;
  const current = await queryTabs({ windowId: restore.windowId });
  const liveIds = new Set(current.map((tab) => tab.id).filter((id): id is number => id != null));
  for (const tab of restore.tabs) {
    if (!liveIds.has(tab.id)) continue;
    try {
      if (tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) await chrome.tabs.ungroup(tab.id);
      else await chrome.tabs.group({ groupId: tab.groupId, tabIds: tab.id });
    } catch {}
  }
  for (const group of restore.groups || []) {
    try { await chrome.tabGroups.update(group.id, { collapsed: group.collapsed }); } catch {}
  }
  const active = restore.tabs.find((tab) => tab.active && liveIds.has(tab.id));
  if (active) try { await chrome.tabs.update(active.id, { active: true }); } catch {}
  await storageRemove(["activeFocusRestore"]);
}

async function startFocus(payload: FocusStartPayload) {
  const minutes = Math.max(1, Math.min(480, Math.round(payload.minutes || 50)));
  const now = Date.now();
  const existing = await storageGet(["timerState"]);
  if (existing.timerState) await endFocus(false);
  if (payload.workspaceId) await resumeWorkspace(payload.workspaceId);
  const tabs = await queryTabs({ currentWindow: true });
  const currentWindow = await chrome.windows.getCurrent();
  const data = await storageGet(["workspaces"]);
  const workspaces: Workspace[] = Array.isArray(data.workspaces) ? data.workspaces : [];
  const workspace = workspaces.find((w) => w.id === payload.workspaceId);
  const workspaceUrls = new Set((workspace?.tabs || []).map((t) => canonicalUrl(t.url)));
  const related = new Set<number>();
  tabs.forEach((tab) => {
    if (tab.id == null) return;
    if (tab.active || tab.pinned || (workspaceUrls.size && workspaceUrls.has(canonicalUrl(tab.url)))) related.add(tab.id);
  });
  const unrelated = tabs.filter((tab) => tab.id != null && isWebUrl(tab.url) && !related.has(tab.id));
  const collapsedGroupIds = Array.from(new Set(unrelated.map((t) => t.groupId).filter((id) => id !== chrome.tabGroups.TAB_GROUP_ID_NONE)));
  const existingGroups = currentWindow.id != null ? await chrome.tabGroups.query({ windowId: currentWindow.id }) : [];
  for (const groupId of collapsedGroupIds) {
    try { await chrome.tabGroups.update(groupId, { collapsed: true }); } catch {}
  }
  const ungroupedIds = unrelated.filter((t) => t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE).map((t) => t.id!);
  const temporaryGroupIds: number[] = [];
  if (ungroupedIds.length > 0) {
    try {
      const groupId = await chrome.tabs.group({ tabIds: ungroupedIds });
      temporaryGroupIds.push(groupId);
      await chrome.tabGroups.update(groupId, { title: "Paused by FocusTab", color: "grey", collapsed: true });
    } catch {}
  }
  const sessionId = uid("focus");
  const timerState: TimerState = {
    title: payload.taskTitle || "Focus session",
    taskId: payload.taskId || null,
    plannedMinutes: minutes,
    endTime: now + minutes * 60 * 1000,
    isPaused: false,
    status: "focus",
    sessionId,
    startedAt: now,
    pausedMs: 0,
    pauseStartedAt: null,
  };
  const restore: FocusRestoreState = {
    sessionId,
    windowId: currentWindow.id!,
    tabs: tabs.filter((t) => t.id != null).map((t) => ({ id: t.id!, groupId: t.groupId, active: !!t.active, pinned: !!t.pinned })),
    temporaryGroupIds,
    groups: existingGroups.filter((group) => collapsedGroupIds.includes(group.id)).map((group) => ({ id: group.id, collapsed: group.collapsed })),
  };
  await storageSet({ timerState, activeFocusRestore: restore, activeWorkspaceId: payload.workspaceId || null });
  chrome.alarms.create(TIMER_ALARM, { when: timerState.endTime });
  const blocking = await syncBlockingRules();
  return { timerState, hiddenCount: unrelated.length, openedCount: workspace?.tabs.length || 0, blockedCount: blocking.activeCount, permissionNeeded: blocking.permissionNeeded };
}

async function appendSession(timer: TimerState, completed: boolean) {
  const data = await storageGet(["focusSessions", "blockedEvents"]);
  const sessions: FocusSessionRecord[] = Array.isArray(data.focusSessions) ? data.focusSessions : [];
  const end = Date.now();
  let paused = timer.pausedMs || 0;
  if (timer.isPaused && timer.pauseStartedAt) paused += end - timer.pauseStartedAt;
  const started = timer.startedAt || end;
  const blockedEvents: any[] = Array.isArray(data.blockedEvents) ? data.blockedEvents : [];
  const distractionCount = blockedEvents.filter((event) => {
    const time = new Date(event.at || event.date || 0).getTime();
    return time >= started && time <= end;
  }).length;
  sessions.unshift({
    id: timer.sessionId || uid("focus"),
    taskId: timer.taskId || null,
    taskTitle: timer.title || "Focus session",
    plannedMinutes: timer.plannedMinutes || 25,
    actualMinutes: Math.max(0, Math.round((end - started - paused) / 60000)),
    startedAt: new Date(started).toISOString(),
    endedAt: new Date(end).toISOString(),
    completed,
    distractionCount,
  });
  await storageSet({ focusSessions: sessions.slice(0, 500) });
}

async function performEndFocus(completed: boolean) {
  const data = await storageGet(["timerState"]);
  const timer = data.timerState as TimerState | undefined;
  if (timer) {
    await storageRemove(["timerState"]);
    if (timer.status !== "break") await appendSession(timer, completed);
  }
  await restoreFocusTabs();
  await storageRemove(["activeWorkspaceId"]);
  await chrome.alarms.clear(TIMER_ALARM);
  await syncBlockingRules();
  return { restored: true };
}

async function endFocus(completed: boolean) {
  if (endingFocus) return endingFocus;
  endingFocus = performEndFocus(completed).finally(() => { endingFocus = null; });
  return endingFocus;
}

async function pauseFocus() {
  const data = await storageGet(["timerState"]);
  const timer = data.timerState as (TimerState & { remainingMs?: number }) | undefined;
  if (!timer || timer.isPaused) return timer;
  timer.remainingMs = Math.max(0, timer.endTime - Date.now());
  timer.isPaused = true;
  timer.pauseStartedAt = Date.now();
  await storageSet({ timerState: timer });
  await chrome.alarms.clear(TIMER_ALARM);
  return timer;
}

async function startBreak(minutes = 5) {
  const existing = await storageGet(["timerState"]);
  if (existing.timerState) await endFocus(existing.timerState.status === "focus");
  const plannedMinutes = Math.max(1, Math.min(60, Math.round(minutes)));
  const now = Date.now();
  const timerState: TimerState = {
    title: "Rest and reset",
    plannedMinutes,
    endTime: now + plannedMinutes * 60 * 1000,
    isPaused: false,
    status: "break",
    sessionId: uid("break"),
    startedAt: now,
    pausedMs: 0,
    pauseStartedAt: null,
  };
  await storageSet({ timerState });
  chrome.alarms.create(TIMER_ALARM, { when: timerState.endTime });
  await syncBlockingRules();
  return timerState;
}

async function resumeFocus() {
  const data = await storageGet(["timerState"]);
  const timer = data.timerState as (TimerState & { remainingMs?: number }) | undefined;
  if (!timer || !timer.isPaused) return timer;
  const now = Date.now();
  const remaining = Math.max(0, timer.remainingMs || 0);
  timer.pausedMs = (timer.pausedMs || 0) + (timer.pauseStartedAt ? now - timer.pauseStartedAt : 0);
  timer.endTime = now + remaining;
  timer.isPaused = false;
  timer.pauseStartedAt = null;
  await storageSet({ timerState: timer });
  chrome.alarms.create(TIMER_ALARM, { when: timer.endTime });
  return timer;
}

async function saveCurrentPage() {
  const [tab] = await queryTabs({ active: true, currentWindow: true });
  if (!tab?.url || !isWebUrl(tab.url)) throw new Error("Open a normal webpage first");
  const data = await storageGet(["savedItems"]);
  const items: any[] = Array.isArray(data.savedItems) ? data.savedItems : [];
  const existing = items.find((item) => canonicalUrl(item.url) === canonicalUrl(tab.url));
  if (!existing) items.unshift({ id: uid("saved"), title: tab.title || tab.url, url: tab.url, collection: "Inbox", savedAt: new Date().toISOString() });
  await storageSet({ savedItems: items.slice(0, 1000) });
  return existing ? { alreadySaved: true } : { alreadySaved: false };
}

async function addCurrentToWorkspace(workspaceId: string) {
  const [tab] = await queryTabs({ active: true, currentWindow: true });
  if (!tab?.url || !isWebUrl(tab.url)) throw new Error("Open a normal webpage first");
  const data = await storageGet(["workspaces"]);
  const workspaces: Workspace[] = Array.isArray(data.workspaces) ? data.workspaces : [];
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  if (!workspace.tabs.some((saved) => canonicalUrl(saved.url) === canonicalUrl(tab.url))) {
    workspace.tabs.push({ id: uid("tab"), title: tab.title || tab.url, url: tab.url, domain: domainOf(tab.url), faviconText: (tab.title || "?").charAt(0).toUpperCase(), faviconBg: "bg-white/15 text-white" });
    workspace.tabCount = workspace.tabs.length;
    workspace.updatedAt = new Date().toISOString();
    await storageSet({ workspaces });
  }
  return { workspaceName: workspace.name };
}

async function addBlockRule(domainInput: string, mode: StoredBlockRule["mode"] = "focus", options: Partial<StoredBlockRule> = {}) {
  const domain = domainInput.includes("://") ? domainOf(domainInput) : domainInput.replace(/^www\./, "").split("/")[0].toLowerCase();
  if (!domain || !domain.includes(".")) throw new Error("Enter a valid domain");
  const rules = await getBlockRules();
  const nextRule: StoredBlockRule = { id: uid("rule"), domain, enabled: true, mode };
  if (mode === "schedule") {
    nextRule.startTime = options.startTime || "09:00";
    nextRule.endTime = options.endTime || "17:00";
    nextRule.days = options.days?.length ? options.days : [1, 2, 3, 4, 5];
  }
  if (mode === "temporary") nextRule.until = Date.now() + Math.max(5, Number(options.until || 60)) * 60 * 1000;
  const existingIndex = rules.findIndex((rule) => rule.domain === domain && rule.mode === mode);
  if (existingIndex >= 0) rules[existingIndex] = { ...rules[existingIndex], ...nextRule, id: rules[existingIndex].id };
  else rules.unshift(nextRule);
  await storageSet({ blockRules: rules });
  return { domain, ...(await syncBlockingRules()) };
}

async function allowOnce(url: string) {
  const domain = domainOf(url);
  if (!domain) return;
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  const allowIds = existing.filter((r) => r.id >= ALLOW_RULE_START).map((r) => r.id);
  const rule: chrome.declarativeNetRequest.Rule = {
    id: ALLOW_RULE_START + Math.floor(Math.random() * 900),
    priority: 100,
    action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
    condition: { requestDomains: [domain], resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME] },
  };
  await dnrUpdateSession(allowIds, [rule]);
  chrome.alarms.create("focustab-allow-once", { when: Date.now() + 5 * 60 * 1000 });
  return chrome.tabs.update({ url });
}

async function recordBlocked(url: string) {
  const data = await storageGet(["blockedEvents", "timerState"]);
  const events: any[] = Array.isArray(data.blockedEvents) ? data.blockedEvents : [];
  events.unshift({ id: uid("blocked"), url, domain: domainOf(url), at: new Date().toISOString(), sessionId: data.timerState?.sessionId || null });
  await storageSet({ blockedEvents: events.slice(0, 2000) });
}

async function clearBrowsingData(payload: Record<string, unknown>) {
  if (!(await permissionContains(["browsingData"]))) throw new Error("Browsing-data permission is required");
  const since = Number(payload.since || Date.now() - 24 * 60 * 60 * 1000);
  const dataToRemove: chrome.browsingData.DataTypeSet = {};
  if (payload.cache) dataToRemove.cache = true;
  if (payload.history) dataToRemove.history = true;
  if (payload.cookies) dataToRemove.cookies = true;
  await chrome.browsingData.remove({ since }, dataToRemove);
  return { cleared: Object.keys(dataToRemove) };
}

async function handleMessage(type: string, payload: Record<string, any>) {
  switch (type) {
    case "search.all": return searchAll(String(payload.query || ""));
    case "search.open": return activateSearchResult(payload.result);
    case "tabs.health": return browserHealth();
    case "tabs.close": await chrome.tabs.remove((payload.tabIds || []).map(Number)); return browserHealth();
    case "tabs.group": {
      const groupId = await chrome.tabs.group({ tabIds: payload.tabIds || [] });
      await chrome.tabGroups.update(groupId, { title: String(payload.name || "FocusTab group"), collapsed: true });
      return browserHealth();
    }
    case "focus.start": return startFocus(payload as FocusStartPayload);
    case "focus.startBreak": return startBreak(Number(payload.minutes || 5));
    case "focus.pause": return pauseFocus();
    case "focus.resume": return resumeFocus();
    case "focus.end": return endFocus(payload.completed !== false);
    case "focus.recover": await restoreFocusTabs(); await syncBlockingRules(); return { restored: true };
    case "workspace.resume": return resumeWorkspace(String(payload.workspaceId));
    case "workspace.addCurrent": return addCurrentToWorkspace(String(payload.workspaceId));
    case "saved.saveCurrent": return saveCurrentPage();
    case "blocking.add": return addBlockRule(String(payload.domain || ""), payload.mode || "focus", payload);
    case "blocking.addCurrent": {
      const [tab] = await queryTabs({ active: true, currentWindow: true });
      return addBlockRule(tab?.url || "", payload.mode || "focus");
    }
    case "blocking.sync": return syncBlockingRules();
    case "blocking.hit": return recordBlocked(String(payload.url || ""));
    case "blocking.allowOnce": return allowOnce(String(payload.url || ""));
    case "browsingData.clear": return clearBrowsingData(payload);
    default: throw new Error(`Unknown FocusTab action: ${type}`);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(String(message?.type || ""), message?.payload || {})
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  return true;
});

chrome.runtime.onInstalled.addListener(async () => {
  try {
    chrome.contextMenus.create({ id: "focustab-save-page", title: "Save page to FocusTab", contexts: ["page", "link"] });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    chrome.alarms.create("focustab-rule-refresh", { periodInMinutes: 1 });
    await syncBlockingRules();
  } catch {}
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("focustab-rule-refresh", { periodInMinutes: 1 });
  syncBlockingRules().catch(() => undefined);
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "focustab-save-page") saveCurrentPage().catch(() => undefined);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TIMER_ALARM) await endFocus(true);
  if (alarm.name === "focustab-rule-refresh") await syncBlockingRules();
  if (alarm.name === "focustab-allow-once") {
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    await dnrUpdateSession(existing.filter((r) => r.id >= ALLOW_RULE_START).map((r) => r.id), []);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isWebUrl(tab.url)) return;
    const data = await storageGet(["activityEvents", "timerState"]);
    const events: any[] = Array.isArray(data.activityEvents) ? data.activityEvents : [];
    events.unshift({ id: uid("activity"), at: new Date().toISOString(), tabId, windowId, domain: domainOf(tab.url), sessionId: data.timerState?.sessionId || null });
    await storageSet({ activityEvents: events.slice(0, 4000) });
  } catch {}
});
