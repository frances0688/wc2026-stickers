import { createWorker, type Worker } from "tesseract.js";
import { parseStickerCode } from "./stickerLookup";

let worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker("eng");
    await worker.setParameters({
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    });
  }
  return worker;
}

export async function recognizeStickerCode(image: Blob | string): Promise<string | null> {
  const w = await getWorker();
  const { data } = await w.recognize(image);
  const text = data.text.replace(/\s/g, "").toUpperCase();

  const candidates = text.match(/(?:FWC\d{1,2}|CC\d{1,2}|[A-Z]{3}\d{1,2}|00)/g) ?? [];
  for (const c of candidates) {
    const parsed = parseStickerCode(c);
    if (parsed) return parsed;
  }

  return parseStickerCode(text);
}

export async function terminateOcr(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
