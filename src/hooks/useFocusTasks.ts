import { useCallback, useEffect, useState } from "react";
import { FocusTask } from "../types/Focus";

const KEY = "focusTasks";
const LEGACY_KEY = "todos";

function toFocusTask(id: string, title: string, done: boolean): FocusTask {
  return {
    id,
    title,
    status: done ? "done" : "todo",
    createdAt: new Date().toISOString(),
    completedAt: done ? new Date().toISOString() : null,
  };
}

function migrateLegacy(legacy: any[]): FocusTask[] | null {
  if (!Array.isArray(legacy) || legacy.length === 0) return null;
  // legacy shape: {id, text, completed}
  if (!legacy[0] || typeof legacy[0].text !== "string") return null;
  return legacy.map((t: any) =>
    toFocusTask(String(t.id ?? Date.now()), String(t.text ?? "Untitled"), !!t.completed)
  );
}

export function useFocusTasks() {
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    chrome.storage.local.get([KEY, LEGACY_KEY], (result) => {
      if (cancelled) return;
      let next: FocusTask[] = result[KEY] || [];
      if ((!next || next.length === 0) && result[LEGACY_KEY]) {
        const migrated = migrateLegacy(result[LEGACY_KEY]);
        if (migrated && migrated.length > 0) {
          next = migrated;
          chrome.storage.local.set({ [KEY]: next });
        }
      }
      setTasks(next || []);
      setLoaded(true);
    });

    const onChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === "local" && changes[KEY]) {
        setTasks(changes[KEY].newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChange);
    };
  }, []);

  const persist = useCallback((next: FocusTask[]) => {
    setTasks(next);
    chrome.storage.local.set({ [KEY]: next });
    // Mirror to legacy shape so older Home UI / downgrades don't lose data
    chrome.storage.local.set({
      [LEGACY_KEY]: next.map((t) => ({
        id: t.id,
        text: t.title,
        completed: t.status === "done",
      })),
    });
  }, []);

  const addTask = useCallback(
    (title: string, estimatedMinutes?: number) => {
      const trimmed = title.trim();
      if (!trimmed) return null;
      const task: FocusTask = {
        id: Date.now().toString(),
        title: trimmed,
        status: "todo",
        estimatedMinutes,
        createdAt: new Date().toISOString(),
        completedAt: null,
      };
      // Need latest state; use functional read via setTasks callback pattern
      setTasks((prev) => {
        const next = [...prev, task];
        chrome.storage.local.set({ [KEY]: next });
        chrome.storage.local.set({
          [LEGACY_KEY]: next.map((t) => ({
            id: t.id,
            text: t.title,
            completed: t.status === "done",
          })),
        });
        return next;
      });
      return task;
    },
    []
  );

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "done" ? ("todo" as const) : ("done" as const),
              completedAt: t.status === "done" ? null : new Date().toISOString(),
            }
          : t
      );
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<FocusTask>) => {
    setTasks((prev) => {
      const next = prev.map((task) => task.id === id ? { ...task, ...changes } : task);
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  const moveTask = useCallback((id: string, direction: -1 | 1) => {
    setTasks((prev) => {
      const index = prev.findIndex((task) => task.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  return { tasks, loaded, addTask, toggleTask, deleteTask, updateTask, moveTask, persist, setTasks };
}
