import React, { useCallback, useEffect, useState } from "react";
import Header from "./shell/Header";
import GlobalSearch from "./shell/GlobalSearch";
import SettingsModal from "./shell/SettingsModal";
import FocusView from "./focus/FocusView";
import WorkspacesView from "./workspaces/WorkspacesView";
import InsightsView from "./insights/InsightsView";
import SavedView from "./saved/SavedView";
import { AppTab } from "../types/Focus";
import { wallpapers } from "../utils/wallpapers";

interface BackgroundState { type: "image" | "color"; value: string; }

const DEFAULT_BACKGROUND = chrome.runtime.getURL("background/focustab-scottish-valley.jpg");

const MacOSLayout: React.FC = () => {
  const [background, setBackground] = useState<BackgroundState>({ type: "image", value: DEFAULT_BACKGROUND });
  const [activeTab, setActiveTab] = useState<AppTab>("focus");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["background", "visualRefreshSep12"], (result) => {
      if (!result.visualRefreshSep12) {
        const next = { type: "image", value: DEFAULT_BACKGROUND } as BackgroundState;
        setBackground(next);
        chrome.storage.local.set({ background: next, visualRefreshSep12: true });
      } else if (result.background) setBackground(result.background);
    });
  }, []);

  const navigate = useCallback((tab: AppTab) => {
    setActiveTab(tab);
  }, []);

  const shuffle = useCallback(() => {
    const current = wallpapers.indexOf(background.value);
    const next = wallpapers[(current + 1 + wallpapers.length) % wallpapers.length] || DEFAULT_BACKGROUND;
    const value: BackgroundState = { type: "image", value: next };
    setBackground(value);
    chrome.storage.local.set({ background: value });
  }, [background.value]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#12201b]" style={background.type === "image" ? { backgroundImage: `url(${background.value})`, backgroundSize: "cover", backgroundPosition: "center" } : { backgroundColor: background.value }}>
      <div className="pointer-events-none absolute inset-0 bg-[rgba(3,9,7,.46)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#06243a]/30 via-transparent to-black/25" />
      <Header active={activeTab} onNavigate={navigate} onOpenSettings={() => setSettingsOpen(true)} onOpenSearch={() => setSearchOpen(true)} onShuffle={shuffle} />
      <main className="relative z-10 min-h-0 flex-1">
        {activeTab === "focus" && <FocusView />}
        {activeTab === "workspaces" && <WorkspacesView />}
        {activeTab === "saved" && <SavedView />}
        {activeTab === "insights" && <InsightsView />}
      </main>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} onNavigate={navigate} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onShuffle={shuffle} />
    </div>
  );
};

export default MacOSLayout;
