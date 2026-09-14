import { useEffect, useState } from "react";
import { FocusSessionRecord, FocusTask } from "../types/Focus";
import { BlockedEvent, TimeEntry, computeInsights, InsightAggregates } from "../utils/insightAggregates";

function activityToTimeEntries(events: any[]): TimeEntry[] {
  const ordered = [...events].filter((event) => event.at && event.domain).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  return ordered.map((event, index) => {
    const started = new Date(event.at).getTime();
    const next = ordered.slice(index + 1).find((candidate) => candidate.windowId === event.windowId);
    const duration = next ? Math.max(0, Math.min(30 * 60 * 1000, new Date(next.at).getTime() - started)) : 0;
    return { domain: event.domain, duration, date: event.at, startTime: started };
  });
}

export function useInsights() {
  const [data, setData] = useState<InsightAggregates | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const refresh = () => chrome.storage.local.get(["focusSessions", "focusTasks", "todos", "timeEntries", "activityEvents", "blockedEvents", "blockRules"], (local) => {
      const sessions: FocusSessionRecord[] = local.focusSessions || [];
      let tasks: FocusTask[] = local.focusTasks || [];
      if (!tasks.length && Array.isArray(local.todos)) tasks = local.todos.map((task: any) => ({ id: String(task.id), title: String(task.text || "Untitled"), status: task.completed ? "done" : "todo", createdAt: new Date().toISOString(), completedAt: task.completed ? new Date().toISOString() : null }));
      const entries: TimeEntry[] = [...(local.timeEntries || []), ...activityToTimeEntries(local.activityEvents || [])];
      const blockedEvents: BlockedEvent[] = (local.blockedEvents || []).map((event: any) => ({ ...event, date: event.date || event.at, hostname: event.hostname || event.domain }));
      const domains = (local.blockRules || []).filter((rule: any) => rule.enabled).map((rule: any) => rule.domain);
      setData(computeInsights(sessions, tasks, entries, blockedEvents, domains));
      setLoaded(true);
    });
    refresh();
    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === "local" && ["focusSessions", "focusTasks", "todos", "timeEntries", "activityEvents", "blockedEvents", "blockRules"].some((key) => changes[key])) refresh();
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  return { data, loaded };
}
