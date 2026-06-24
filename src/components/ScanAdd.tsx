import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Sticker } from "../types";
import { incrementOwned, saveUserPhoto } from "../db";
import { getSticker, lookupByTeamSlot, normalizeCode, parseStickerCode, TEAM_CODES } from "../lib/stickerLookup";
import { recognizeStickerCode } from "../lib/ocr";
import { captureFromVideo, compressImage } from "../lib/imageCompress";
import { StickerImage } from "./StickerImage";

interface ScanAddProps {
  photoCodes: Set<string>;
  onUpdated: () => void;
}

type Step = "choose" | "back-camera" | "front-camera" | "confirm" | "manual";

export function ScanAdd({ photoCodes, onUpdated }: ScanAddProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [code, setCode] = useState("");
  const [sticker, setSticker] = useState<Sticker | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ocrStatus, setOcrStatus] = useState("");

  const frontPreview = useMemo(
    () => (frontBlob ? URL.createObjectURL(frontBlob) : null),
    [frontBlob],
  );

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    };
  }, [frontPreview]);

  const [manualTeam, setManualTeam] = useState("ARG");
  const [manualSlot, setManualSlot] = useState(1);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      stopCamera();
      setError("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera access denied. Use manual entry instead.");
      }
    },
    [stopCamera],
  );

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (step === "back-camera") startCamera("environment");
    if (step === "front-camera") startCamera("environment");
  }, [step, startCamera]);

  const lookupCode = (raw: string) => {
    const parsed = parseStickerCode(raw) ?? normalizeCode(raw);
    const found = getSticker(parsed);
    if (found) {
      setCode(found.code);
      setSticker(found);
      return found;
    }
    setSticker(null);
    setError(`Unknown code: ${parsed}`);
    return null;
  };

  const captureBack = async () => {
    if (!videoRef.current) return;
    setBusy(true);
    setOcrStatus("Reading code…");
    setError("");
    try {
      const blob = captureFromVideo(videoRef.current);
      const recognized = await recognizeStickerCode(blob);
      if (recognized) {
        const found = lookupCode(recognized);
        if (found) {
          stopCamera();
          setStep("front-camera");
          setOcrStatus(`Found: ${recognized}`);
        }
      } else {
        setError("Could not read code. Try again or enter manually.");
        setOcrStatus("");
      }
    } catch {
      setError("OCR failed. Try manual entry.");
    }
    setBusy(false);
  };

  const captureFront = async () => {
    if (!videoRef.current) return;
    const blob = captureFromVideo(videoRef.current);
    const compressed = await compressImage(blob);
    setFrontBlob(compressed);
    stopCamera();
    setStep("confirm");
  };

  const skipFront = () => {
    stopCamera();
    setFrontBlob(null);
    setStep("confirm");
  };

  const manualLookup = () => {
    const found = lookupByTeamSlot(manualTeam, manualSlot);
    if (found) {
      setSticker(found);
      setCode(found.code);
      setStep("confirm");
      setError("");
    } else {
      setError(`No sticker ${manualTeam}${manualSlot}`);
    }
  };

  const save = async () => {
    if (!sticker) return;
    setBusy(true);
    try {
      await incrementOwned(sticker.code, quantity);
      if (frontBlob) await saveUserPhoto(sticker.code, frontBlob);
      await onUpdated();
      setStep("choose");
      setSticker(null);
      setCode("");
      setQuantity(1);
      setFrontBlob(null);
      setOcrStatus("");
    } catch {
      setError("Failed to save");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {step === "choose" && (
        <>
          <p className="text-slate-400">Add a duplicate sticker to your inventory</p>
          <button
            type="button"
            onClick={() => setStep("back-camera")}
            className="rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white"
          >
            Scan sticker (camera)
          </button>
          <button
            type="button"
            onClick={() => setStep("manual")}
            className="rounded-xl bg-slate-700 py-4 text-lg font-medium text-white"
          >
            Enter code manually
          </button>
        </>
      )}

      {(step === "back-camera" || step === "front-camera") && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-slate-300">
            {step === "back-camera"
              ? "Photograph the code on the back of the sticker"
              : "Optional: photograph the front (or skip)"}
          </p>
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
            <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-dashed border-white/50" />
          </div>
          {ocrStatus && <p className="text-center text-sm text-emerald-400">{ocrStatus}</p>}
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setStep("choose");
              }}
              className="flex-1 rounded-xl bg-slate-700 py-3 text-white"
            >
              Cancel
            </button>
            {step === "back-camera" ? (
              <button
                type="button"
                disabled={busy}
                onClick={captureBack}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white"
              >
                {busy ? "Reading…" : "Capture & read"}
              </button>
            ) : (
              <>
                <button type="button" onClick={skipFront} className="flex-1 rounded-xl bg-slate-700 py-3 text-white">
                  Skip
                </button>
                <button type="button" onClick={captureFront} className="flex-1 rounded-xl bg-blue-600 py-3 text-white">
                  Capture front
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "manual" && (
        <div className="flex flex-col gap-3">
          <label className="text-sm text-slate-400">Or type code directly</label>
          <input
            type="text"
            placeholder="e.g. ARG17"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              lookupCode(e.target.value);
            }}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-lg uppercase text-white"
          />
          <div className="flex gap-2">
            <select
              value={manualTeam}
              onChange={(e) => setManualTeam(e.target.value)}
              className="flex-1 rounded-xl bg-slate-800 px-3 py-3 text-white"
            >
              {TEAM_CODES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={manualSlot}
              onChange={(e) => setManualSlot(Number(e.target.value))}
              className="w-24 rounded-xl bg-slate-800 px-3 py-3 text-white"
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button type="button" onClick={manualLookup} className="rounded-xl bg-blue-600 py-3 text-white">
            Look up
          </button>
          <button type="button" onClick={() => setStep("choose")} className="rounded-xl bg-slate-700 py-3 text-white">
            Back
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      )}

      {step === "confirm" && sticker && (
        <div className="flex flex-col gap-4">
          {frontPreview ? (
            <img
              src={frontPreview}
              alt="Captured sticker"
              className="mx-auto aspect-[2/3] w-40 rounded-xl object-cover"
            />
          ) : (
            <StickerImage
              sticker={sticker}
              hasUserPhoto={photoCodes.has(sticker.code)}
              className="mx-auto aspect-[2/3] w-40 rounded-xl"
            />
          )}
          {frontBlob && <p className="text-center text-xs text-emerald-400">Front photo will be saved</p>}
          <div className="text-center">
            <p className="text-xl font-bold text-white">{sticker.name}</p>
            <p className="text-slate-400">
              {sticker.code} · {sticker.country}
            </p>
          </div>
          <div>
            <label className="text-sm text-slate-400">Confirm or edit code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                lookupCode(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 uppercase text-white"
            />
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 rounded-full bg-slate-700 text-xl text-white"
            >
              −
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{quantity}</p>
              <p className="text-xs text-slate-400">copies to add</p>
            </div>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="h-10 w-10 rounded-full bg-blue-600 text-xl text-white"
            >
              +
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("choose");
                setSticker(null);
              }}
              className="flex-1 rounded-xl bg-slate-700 py-3 text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !sticker}
              onClick={save}
              className="flex-1 rounded-xl bg-emerald-600 py-3 font-medium text-white"
            >
              {busy ? "Saving…" : "Add to collection"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
