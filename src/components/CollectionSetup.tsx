import { useMemo, useRef, useState } from "react";
import { applyCollectionLists } from "../db";
import { getAllStickers } from "../lib/stickerLookup";
import { parseBulkCodes, parseDuplicateInput } from "../lib/parseBulk";
import { buildBackup, downloadBackup, readBackupFile, restoreBackup } from "../lib/backup";

interface CollectionSetupProps {
  initialMissing?: string[];
  initialDuplicates?: string;
  onApplied: () => void;
  onClose?: () => void;
}

export function CollectionSetup({ initialMissing, initialDuplicates, onApplied, onClose }: CollectionSetupProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [missingText, setMissingText] = useState(initialMissing?.join(", ") ?? "");
  const [duplicatesText, setDuplicatesText] = useState(initialDuplicates ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backupMsg, setBackupMsg] = useState("");

  const preview = useMemo(() => {
    const missing = parseBulkCodes(missingText);
    const dupes = parseDuplicateInput(duplicatesText);
    const total = getAllStickers().length;
    const missingSet = new Set(missing);
    let dupeExtras = 0;
    for (const [code, count] of dupes) {
      if (!missingSet.has(code)) dupeExtras += count;
    }
    const ownedCount = total - missing.length;
    return { missing, dupes, ownedCount, dupeExtras, total };
  }, [missingText, duplicatesText]);

  const unknownMissing = preview.missing.filter((c) => !getAllStickers().some((s) => s.code === c));
  const unknownDupes = [...preview.dupes.keys()].filter((c) => !getAllStickers().some((s) => s.code === c));

  const apply = async () => {
    setBusy(true);
    setError("");
    try {
      const missing = parseBulkCodes(missingText).filter((c) => getAllStickers().some((s) => s.code === c));
      const dupes = parseDuplicateInput(duplicatesText);
      await applyCollectionLists(missing, dupes);
      await onApplied();
      onClose?.();
    } catch {
      setError("Failed to save collection");
    }
    setBusy(false);
  };

  const exportBackup = async () => {
    setBusy(true);
    setError("");
    setBackupMsg("");
    try {
      const backup = await buildBackup();
      downloadBackup(backup);
      setBackupMsg(`Backup saved (${backup.missing.length} missing, ${Object.keys(backup.duplicates).length} dupes)`);
    } catch {
      setError("Failed to create backup");
    }
    setBusy(false);
  };

  const importBackup = async (file: File) => {
    if (!confirm("Restore this backup? Your current collection will be replaced.")) return;
    setBusy(true);
    setError("");
    setBackupMsg("");
    try {
      const backup = await readBackupFile(file);
      await restoreBackup(backup);
      setMissingText(backup.missing.join(", "));
      setDuplicatesText(
        Object.entries(backup.duplicates)
          .map(([code, extras]) => (extras > 1 ? `${code} x${extras}` : code))
          .join("\n"),
      );
      await onApplied();
      setBackupMsg(`Restored backup from ${backup.exportedAt.slice(0, 10)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to restore backup");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold text-white">Set up your collection</h2>
        <p className="mt-1 text-sm text-slate-400">
          Enter only what you're <strong className="text-red-300">missing</strong> and what you have{" "}
          <strong className="text-amber-300">duplicated</strong>. Everything else is marked as owned.
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-red-300">Missing stickers</span>
        <span className="text-xs text-slate-500">Paste codes: ARG17, MEX 4, FWC1 …</span>
        <textarea
          value={missingText}
          onChange={(e) => setMissingText(e.target.value)}
          rows={4}
          placeholder="ARG 10, MEX 4, GER 7"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-amber-300">Duplicate stickers</span>
        <span className="text-xs text-slate-500">One extra per line; use x2 for more: ARG17 x2</span>
        <textarea
          value={duplicatesText}
          onChange={(e) => setDuplicatesText(e.target.value)}
          rows={4}
          placeholder="ARG17&#10;BRA14 x2&#10;ENG11"
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-600"
        />
      </label>

      <div className="rounded-xl bg-slate-800/80 p-3 text-sm text-slate-300">
        <p>
          <span className="text-emerald-400">{preview.ownedCount}</span> owned ·{" "}
          <span className="text-red-400">{preview.missing.length}</span> missing ·{" "}
          <span className="text-amber-400">{preview.dupeExtras}</span> extra copies
        </p>
        {(unknownMissing.length > 0 || unknownDupes.length > 0) && (
          <p className="mt-1 text-xs text-amber-400">
            Unknown codes ignored: {[...unknownMissing, ...unknownDupes].slice(0, 5).join(", ")}
            {[...unknownMissing, ...unknownDupes].length > 5 ? "…" : ""}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={apply}
        className="rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Apply — mark rest as owned"}
      </button>

      <div className="mt-2 border-t border-slate-700 pt-4">
        <h3 className="text-sm font-semibold text-white">Backup & restore</h3>
        <p className="mt-1 text-xs text-slate-500">
          Save a JSON file to iCloud Drive, Google Drive, or email. Restore on a new phone or after a reset.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={exportBackup}
            className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Download backup
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="flex-1 rounded-xl bg-slate-700 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Restore backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importBackup(file);
            e.target.value = "";
          }}
        />
        {backupMsg && <p className="mt-2 text-xs text-emerald-400">{backupMsg}</p>}
      </div>
    </div>
  );
}
