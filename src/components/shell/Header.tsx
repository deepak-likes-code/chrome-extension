import React from "react";
import { Mountain, Search, Settings, Sun } from "lucide-react";
import { AppTab } from "../../types/Focus";

interface HeaderProps {
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onShuffle: () => void;
}

const NAV: { id: AppTab; label: string }[] = [
  { id: "focus", label: "Home" },
  { id: "workspaces", label: "Workspaces" },
  { id: "insights", label: "Insights" },
];

const Header: React.FC<HeaderProps> = ({ active, onNavigate, onOpenSettings, onOpenSearch, onShuffle }) => (
  <header className="absolute inset-x-0 top-0 z-30 grid h-[82px] grid-cols-[1fr_auto_1fr] items-center px-[clamp(28px,3vw,52px)] text-white">
    <button onClick={() => onNavigate("focus")} className="flex w-fit items-center gap-3" aria-label="FocusTab home">
      <Mountain className="h-7 w-7 fill-white text-white" strokeWidth={1.4} />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">FocusTab</span>
    </button>

    <nav className="flex items-center gap-1 rounded-full" aria-label="Primary navigation">
      {NAV.map((item) => (
        <button key={item.id} onClick={() => onNavigate(item.id)} className={`min-w-[92px] rounded-[17px] px-5 py-3 text-[14px] transition ${active === item.id ? "border border-white/5 bg-white/[0.16] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl" : "text-white/78 hover:bg-white/[0.06] hover:text-white"}`}>
          {item.label}
        </button>
      ))}
    </nav>

    <div className="flex items-center justify-end gap-3">
      <button onClick={onOpenSearch} aria-label="Search or open a website" className="hidden h-10 items-center gap-2 rounded-xl border border-white/12 bg-black/15 px-3 text-[12px] text-white/70 backdrop-blur-xl transition hover:bg-white/10 hover:text-white md:flex">
        <Search className="h-4 w-4" strokeWidth={1.8} />
        <span className="hidden min-[1180px]:inline">Search</span>
        <span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/45">⌘K</span>
      </button>
      <button onClick={onShuffle} aria-label="Change background" className="rounded-full p-2 text-white/90 hover:bg-white/10"><Sun className="h-6 w-6" strokeWidth={1.7} /></button>
      <span className="h-7 w-px bg-white/15" />
      <button onClick={onOpenSettings} aria-label="Settings" className="rounded-full p-2 text-white/90 hover:bg-white/10"><Settings className="h-6 w-6" strokeWidth={1.8} /></button>
      <p className="ml-5 hidden text-right text-[13px] leading-[1.5] text-white/65 2xl:block">A calmer internet<br />for a brighter you.</p>
    </div>
  </header>
);

export default Header;
