import { useMemo, useState } from "react";
import type { TabId } from "./types";
import { useCollection } from "./hooks/useCollection";
import { BottomNav } from "./components/BottomNav";
import { Gallery } from "./components/Gallery";
import { ScanAdd } from "./components/ScanAdd";
import { Duplicates } from "./components/Duplicates";
import { MissingList } from "./components/MissingList";
import { CollectionSetup } from "./components/CollectionSetup";
import { getSticker } from "./lib/stickerLookup";

function ExchangeHistory({ exchanges }: { exchanges: ReturnType<typeof useCollection>["exchanges"] }) {
  if (exchanges.length === 0) return null;
  return (
    <details className="mt-6 rounded-xl bg-slate-800/50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-300">
        Exchange history ({exchanges.length})
      </summary>
      <ul className="mt-2 space-y-2">
        {exchanges.map((ex) => {
          const gave = getSticker(ex.gaveCode);
          const received = getSticker(ex.receivedCode);
          return (
            <li key={ex.id} className="text-xs text-slate-400">
              {new Date(ex.createdAt).toLocaleDateString()}:{" "}
              <span className="text-amber-400">{ex.gaveCode}</span> ({gave?.name}) →{" "}
              <span className="text-emerald-400">{ex.receivedCode}</span> ({received?.name})
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabId>("gallery");
  const { ready, stickersWithState, photoCodes, exchanges, stats, refresh } = useCollection();

  const missingStickers = useMemo(
    () => stickersWithState.filter((s) => s.owned === 0),
    [stickersWithState],
  );

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-white">
        Loading collection…
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold">WC 2026 Stickers</h1>
        <p className="text-xs text-slate-400">
          {stats.ownedCount}/{stats.total} collected · {stats.duplicateCount} dupes · {stats.missingCount} missing
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-24 pt-4">
        {tab === "gallery" && (
          <Gallery stickers={stickersWithState} photoCodes={photoCodes} onUpdated={refresh} />
        )}
        {tab === "setup" && (
          <CollectionSetup
            initialMissing={missingStickers.map((s) => s.code)}
            initialDuplicates={stickersWithState
              .filter((s) => s.extras > 0)
              .map((s) => (s.extras > 1 ? `${s.code} x${s.extras}` : s.code))
              .join("\n")}
            onApplied={refresh}
          />
        )}
        {tab === "scan" && <ScanAdd photoCodes={photoCodes} onUpdated={refresh} />}
        {tab === "duplicates" && (
          <>
            <Duplicates
              stickers={stickersWithState}
              photoCodes={photoCodes}
              missingStickers={missingStickers}
              onUpdated={refresh}
            />
            <ExchangeHistory exchanges={exchanges} />
          </>
        )}
        {tab === "missing" && <MissingList stickers={stickersWithState} photoCodes={photoCodes} />}
      </main>

      <BottomNav active={tab} onChange={setTab} stats={stats} />
    </div>
  );
}
