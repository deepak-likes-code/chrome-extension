import { AiInsight, InsightKpi, TrendPoint } from "../types/Insight";

export const mockKpis: InsightKpi[] = [
  { id: "focus", label: "Focus Time", value: "12h 15m", delta: "18% vs last week", deltaDirection: "up", icon: "clock" },
  { id: "tasks", label: "Tasks Done", value: "28", delta: "27% vs last week", deltaDirection: "up", icon: "check" },
  { id: "distraction", label: "Distraction Time", value: "2h 12m", delta: "32% vs last week", deltaDirection: "down", icon: "block" },
  { id: "score", label: "Focus Score", value: "87%", delta: "12% vs last week", deltaDirection: "up", icon: "chart" },
  { id: "switch", label: "Context Switching", value: "14", delta: "35% vs last week", deltaDirection: "down", icon: "switch" },
];

export const mockTrends: TrendPoint[] = [
  { day: "Mon", value: 3 },
  { day: "Tue", value: 4.3 },
  { day: "Wed", value: 4.7 },
  { day: "Thu", value: 5.5 },
  { day: "Fri", value: 3.7 },
  { day: "Sat", value: 2 },
  { day: "Sun", value: 3.1 },
];

export const mockAiInsights: AiInsight[] = [
  {
    id: "a1",
    title: "Your best focus window",
    body: "You're most focused between 9:00 AM – 11:00 AM.",
    icon: "sun",
  },
  {
    id: "a2",
    title: "Biggest distraction",
    body: "Social media took 1h 24m this week (42% less than last week).",
    icon: "block",
  },
  {
    id: "a3",
    title: "Keep it up!",
    body: "Your focus time is 18% higher than last week.",
    icon: "bulb",
  },
];

export const mockDailySummary = {
  dateLabel: "Mon, Jan 27",
  focusTime: "2h 15m",
  tasksDone: "3",
  distractionTime: "12m",
  focusScore: "87%",
};
