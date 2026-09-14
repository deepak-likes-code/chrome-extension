import { useCallback, useEffect, useMemo, useState } from "react";
import { FocusSessionRecord } from "../types/Focus";
import { TimerState } from "../types/Timer";
import { sendExtensionMessage } from "../types/Messages";

const TIMER_KEY = "timerState";
const SESSIONS_KEY = "focusSessions";

function remainingMsOf(timer: TimerState | null) {
  if (!timer) return 0;
  if (timer.isPaused) return Math.max(0, (timer as TimerState & { remainingMs?: number }).remainingMs || 0);
  return Math.max(0, timer.endTime - Date.now());
}

export function useFocusSession() {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [sessions, setSessions] = useState<FocusSessionRecord[]>([]);
  const [blockedToday, setBlockedToday] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    chrome.storage.local.get([TIMER_KEY, SESSIONS_KEY, "blockedEvents"], (result) => {
      setTimerState(result[TIMER_KEY] || null);
      setSessions(result[SESSIONS_KEY] || []);
      const today = new Date().toISOString().slice(0, 10);
      setBlockedToday((result.blockedEvents || []).filter((event: any) => String(event.at || event.date || "").startsWith(today)).length);
    });
    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area !== "local") return;
      if (changes[TIMER_KEY]) setTimerState(changes[TIMER_KEY].newValue || null);
      if (changes[SESSIONS_KEY]) setSessions(changes[SESSIONS_KEY].newValue || []);
      if (changes.blockedEvents) {
        const today = new Date().toISOString().slice(0, 10);
        setBlockedToday((changes.blockedEvents.newValue || []).filter((event: any) => String(event.at || event.date || "").startsWith(today)).length);
      }
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (!timerState || timerState.isPaused) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timerState?.endTime, timerState?.isPaused]);

  const timeLeftSec = useMemo(() => Math.max(0, Math.ceil(remainingMsOf(timerState) / 1000)), [timerState, now]);
  const plannedSec = (timerState?.plannedMinutes || 50) * 60;
  const progress = timerState ? Math.min(1, Math.max(0, 1 - timeLeftSec / plannedSec)) : 0;

  const start = useCallback(async (taskId: string | null, title: string, minutes: number, workspaceId?: string | null) => {
    const response = await sendExtensionMessage<{ timerState: TimerState }>("focus.start", {
      taskId,
      taskTitle: title,
      minutes,
      workspaceId: workspaceId || null,
    });
    if (!response.ok) throw new Error(response.error || "Unable to start focus");
    if (response.data?.timerState) setTimerState(response.data.timerState);
    setNow(Date.now());
    return response.data;
  }, []);

  const pause = useCallback(async () => {
    const response = await sendExtensionMessage<TimerState>("focus.pause");
    if (response.ok && response.data) setTimerState(response.data);
  }, []);

  const startBreak = useCallback(async (minutes = 5) => {
    const response = await sendExtensionMessage<TimerState>("focus.startBreak", { minutes });
    if (response.ok && response.data) setTimerState(response.data);
    return response;
  }, []);

  const resume = useCallback(async () => {
    const response = await sendExtensionMessage<TimerState>("focus.resume");
    if (response.ok && response.data) setTimerState(response.data);
    setNow(Date.now());
  }, []);

  const end = useCallback(async (completed = true) => {
    const response = await sendExtensionMessage("focus.end", { completed });
    if (response.ok) setTimerState(null);
    return response;
  }, []);

  const cancel = useCallback(() => end(false), [end]);

  useEffect(() => {
    if (timerState && !timerState.isPaused && timeLeftSec <= 0) end(true);
  }, [timerState?.sessionId, timerState?.isPaused, timeLeftSec, end]);

  const todaySessions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sessions.filter((session) => String(session.startedAt || "").startsWith(today));
  }, [sessions]);
  const focusTodayMin = useMemo(() => todaySessions.reduce((sum, session) => sum + (session.actualMinutes || 0), 0), [todaySessions]);

  return {
    timerState,
    isRunning: !!timerState,
    isPaused: !!timerState?.isPaused,
    timeLeftSec,
    progress,
    sessions,
    todaySessions,
    focusTodayMin,
    blockedToday,
    start,
    startBreak,
    pause,
    resume,
    end,
    cancel,
  };
}
