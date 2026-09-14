import { useCallback, useEffect, useMemo, useState } from "react";
import { Workspace, WorkspaceTab } from "../types/Workspace";
import { sendExtensionMessage } from "../types/Messages";

const KEY = "workspaces";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Last active • just now";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Last active • just now";
  if (mins < 60) return `Last active • ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last active • ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last active • ${days}d ago`;
}

function withCounts(w: Workspace): Workspace {
  return { ...w, tabCount: w.tabs.length, lastActive: timeAgo(w.lastActiveAt || w.updatedAt) };
}

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openTabCount, setOpenTabCount] = useState(0);

  // Load real local workspaces. Empty is a valid first-run state.
  useEffect(() => {
    chrome.storage.local.get([KEY, "workspaceSeedRemovedV1"], (result) => {
      let list: Workspace[] = Array.isArray(result[KEY]) ? result[KEY] : [];
      const demoIds = ["work", "nakshatra", "personal", "research", "travel", "side"];
      const isLegacyDemo = !result.workspaceSeedRemovedV1 && list.length === demoIds.length && demoIds.every((id) => list.some((workspace) => workspace.id === id)) && list.some((workspace) => workspace.tabs.some((tab) => tab.url && !/^https?:\/\//i.test(tab.url)));
      if (isLegacyDemo) {
        list = [];
        chrome.storage.local.set({ [KEY]: [], workspaceSeedRemovedV1: true });
      }
      setWorkspaces(list.map(withCounts));
      setLoaded(true);
    });
    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes[KEY]) {
        setWorkspaces((changes[KEY].newValue || []).map(withCounts));
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  // Live open-tab count
  const refreshOpenCount = useCallback(() => {
    try {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        setOpenTabCount(tabs.length);
      });
    } catch {}
  }, []);

  useEffect(() => {
    refreshOpenCount();
    const id = setInterval(refreshOpenCount, 5000);
    return () => clearInterval(id);
  }, [refreshOpenCount]);

  const persist = useCallback((next: Workspace[]) => {
    const stamped = next.map((w) => ({ ...w, updatedAt: new Date().toISOString() }));
    setWorkspaces(stamped.map(withCounts));
    chrome.storage.local.set({ [KEY]: stamped });
  }, []);

  const createWorkspace = useCallback(
    (name: string) => {
      const trimmed = name.trim() || `Workspace ${workspaces.length + 1}`;
      const icons = ["briefcase", "star", "leaf", "laptop", "plane", "people"] as const;
      const bgs = [
        "bg-emerald-400/20",
        "bg-purple-500/20",
        "bg-green-500/20",
        "bg-blue-500/20",
        "bg-rose-400/20",
        "bg-orange-400/20",
      ];
      const i = workspaces.length % icons.length;
      const ws: Workspace = {
        id: `ws-${Date.now()}`,
        name: trimmed,
        tabCount: 0,
        lastActive: "Last active • just now",
        lastActiveAt: new Date().toISOString(),
        iconBg: bgs[i],
        icon: icons[i],
        tabs: [],
        savedCount: 0,
        notesCount: 0,
        archived: false,
        updatedAt: new Date().toISOString(),
      };
      persist([...workspaces, ws]);
      return ws;
    },
    [workspaces, persist]
  );

  const saveCurrentTabs = useCallback(
    (workspaceId: string, opts?: { replace?: boolean }) => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) return;
        const mapped: WorkspaceTab[] = tabs
          .filter((t) => t.url && /^https?:\/\//i.test(t.url))
          .map((t, idx) => ({
            id: `t-${Date.now()}-${idx}`,
            title: t.title || t.url || "Untitled",
            url: t.url!,
            domain: domainOf(t.url!),
            faviconText: (t.title || t.url || "?").charAt(0).toUpperCase(),
            faviconBg: "bg-white/15 text-white",
          }));
        const next = workspaces.map((w) => {
          if (w.id !== workspaceId) return w;
          const merged = opts?.replace ? mapped : [...w.tabs, ...mapped.filter((m) => !w.tabs.some((e) => e.url === m.url))];
          return { ...w, tabs: merged, lastActiveAt: new Date().toISOString() };
        });
        persist(next);
        refreshOpenCount();
      });
    },
    [workspaces, persist, refreshOpenCount]
  );

  const resumeWorkspace = useCallback(
    (workspaceId: string) => {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (!ws) return;
      sendExtensionMessage("workspace.resume", { workspaceId }).then(() => refreshOpenCount());
    },
    [workspaces, persist, refreshOpenCount]
  );

  const removeStoredTab = useCallback(
    (workspaceId: string, tabId: string) => {
      persist(
        workspaces.map((w) =>
          w.id === workspaceId ? { ...w, tabs: w.tabs.filter((t) => t.id !== tabId) } : w
        )
      );
    },
    [workspaces, persist]
  );

  const archiveWorkspace = useCallback(
    (workspaceId: string, archived = true) => {
      persist(workspaces.map((w) => (w.id === workspaceId ? { ...w, archived } : w)));
    },
    [workspaces, persist]
  );

  const renameWorkspace = useCallback((workspaceId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist(workspaces.map((w) => w.id === workspaceId ? { ...w, name: trimmed } : w));
  }, [workspaces, persist]);

  const changeWorkspaceIcon = useCallback((workspaceId: string, icon: Workspace["icon"]) => {
    persist(workspaces.map((w) => w.id === workspaceId ? { ...w, icon } : w));
  }, [workspaces, persist]);

  const stats = useMemo(() => {
    const visible = workspaces.filter((w) => !w.archived);
    const archivedTabs = workspaces.filter((w) => w.archived).reduce((a, w) => a + w.tabs.length, 0);
    return {
      totalWorkspaces: `${visible.length}`,
      openTabs: `${openTabCount}`,
      archivedTabs: `${archivedTabs}`,
      recoveredTime: "—",
    };
  }, [workspaces, openTabCount]);

  return {
    workspaces,
    visibleWorkspaces: workspaces.filter((w) => !w.archived),
    loaded,
    stats,
    openTabCount,
    createWorkspace,
    saveCurrentTabs,
    resumeWorkspace,
    removeStoredTab,
    archiveWorkspace,
    renameWorkspace,
    changeWorkspaceIcon,
    refreshOpenCount,
  };
}
