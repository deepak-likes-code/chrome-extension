export interface InsightKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  deltaDirection: "up" | "down";
  icon: "clock" | "check" | "block" | "chart" | "switch";
}

export interface AiInsight {
  id: string;
  title: string;
  body: string;
  icon: "sun" | "block" | "bulb";
}

export interface TrendPoint {
  day: string;
  value: number;
}
