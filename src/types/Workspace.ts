export interface WorkspaceTab {
  id: string;
  title: string;
  url: string;
  domain: string;
  faviconText: string;
  faviconBg: string;
}

export interface Workspace {
  id: string;
  name: string;
  tabCount: number;
  lastActive: string;
  lastActiveAt?: string | null;
  iconBg: string;
  icon: "briefcase" | "star" | "leaf" | "laptop" | "plane" | "people";
  tabs: WorkspaceTab[];
  savedCount: number;
  notesCount: number;
  archived?: boolean;
  updatedAt?: string;
}

export type WorkspaceIcon = Workspace["icon"];
