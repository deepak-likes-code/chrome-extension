export type SearchResultKind =
  | "tab"
  | "history"
  | "bookmark"
  | "saved"
  | "task"
  | "workspace"
  | "recent";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  url?: string;
  tabId?: number;
  workspaceId?: string;
  taskId?: string;
  score?: number;
}

export interface TabHealthItem {
  id: number;
  title: string;
  url: string;
  domain: string;
  lastAccessed?: number;
}

export interface BrowserHealth {
  openCount: number;
  duplicateCount: number;
  staleCount: number;
  duplicateTabIds: number[];
  staleTabs: TabHealthItem[];
  suggestedGroups: Array<{ name: string; tabIds: number[]; count: number }>;
}

export interface FocusStartPayload {
  taskId?: string | null;
  taskTitle: string;
  minutes: number;
  workspaceId?: string | null;
}

export interface ExtensionResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function sendExtensionMessage<T = unknown>(
  type: string,
  payload?: Record<string, unknown>
): Promise<ExtensionResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      const error = chrome.runtime.lastError;
      if (error) {
        resolve({ ok: false, error: error.message });
        return;
      }
      resolve(response || { ok: false, error: "No response from FocusTab" });
    });
  });
}
