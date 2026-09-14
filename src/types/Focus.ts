export type TaskStatus = "todo" | "done" | "later";

export interface FocusTask {
  id: string;
  title: string;
  status: TaskStatus;
  estimatedMinutes?: number;
  workspaceId?: string | null;
  dueAt?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface FocusSessionRecord {
  id: string;
  taskId?: string | null;
  taskTitle: string;
  plannedMinutes: number;
  actualMinutes: number;
  startedAt: string;
  endedAt?: string | null;
  completed: boolean;
  distractionCount?: number;
}

export type AppTab = "focus" | "workspaces" | "saved" | "insights";
