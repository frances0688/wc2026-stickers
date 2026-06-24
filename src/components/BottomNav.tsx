import type { TabId } from "../types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "gallery", label: "Gallery", icon: "▦" },
  { id: "setup", label: "Setup", icon: "☰" },
  { id: "scan", label: "Scan", icon: "◎" },
  { id: "duplicates", label: "Dupes", icon: "⊕" },
  { id: "missing", label: "Missing", icon: "○" },
];

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  stats: { duplicateCount: number; missingCount: number };
}

export function BottomNav({ active, onChange, stats }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-700 bg-slate-900/95 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-lg justify-around">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              active === tab.id ? "text-blue-400" : "text-slate-400"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === "duplicates" && stats.duplicateCount > 0 && (
              <span className="absolute right-3 top-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-slate-900">
                {stats.duplicateCount}
              </span>
            )}
            {tab.id === "missing" && stats.missingCount > 0 && (
              <span className="absolute right-3 top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {stats.missingCount > 99 ? "99+" : stats.missingCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
