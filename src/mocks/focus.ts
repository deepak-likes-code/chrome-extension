import { FocusSessionRecord, FocusTask } from "../types/Focus";

export const mockFocusTasks: FocusTask[] = [
  {
    id: "t1",
    title: "Go to the park",
    status: "done",
    estimatedMinutes: 25,
    createdAt: "2024-01-27T08:00:00",
    completedAt: "2024-01-27T09:00:00",
  },
  {
    id: "t2",
    title: "Finish checkout integration",
    status: "todo",
    estimatedMinutes: 50,
    workspaceId: "work",
    createdAt: "2024-01-27T08:10:00",
  },
  {
    id: "t3",
    title: "Write project proposal",
    status: "todo",
    estimatedMinutes: 50,
    createdAt: "2024-01-27T08:20:00",
  },
  {
    id: "t4",
    title: "Read for 30 minutes",
    status: "todo",
    estimatedMinutes: 25,
    createdAt: "2024-01-27T08:30:00",
  },
];

export const mockSessionHistory: FocusSessionRecord[] = [
  {
    id: "s1",
    taskTitle: "Deep work on UI designs",
    plannedMinutes: 50,
    actualMinutes: 50,
    startedAt: "2024-01-27T10:24:00",
    completed: true,
  },
  {
    id: "s2",
    taskTitle: "Product research",
    plannedMinutes: 25,
    actualMinutes: 25,
    startedAt: "2024-01-27T09:30:00",
    completed: true,
  },
  {
    id: "s3",
    taskTitle: "Write project proposal",
    plannedMinutes: 50,
    actualMinutes: 50,
    startedAt: "2024-01-27T08:15:00",
    completed: true,
  },
  {
    id: "s4",
    taskTitle: "Plan next week",
    plannedMinutes: 25,
    actualMinutes: 0,
    startedAt: "2024-01-26T16:00:00",
    completed: false,
  },
];

export const mockFocusStats = {
  focusToday: "2h 15m",
  sessionsCompleted: "3 / 6",
  distractionsBlocked: "12",
  focusScore: "87%",
  dateLabel: "Mon, Jan 27",
};
