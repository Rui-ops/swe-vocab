import type { AppDataset, LevelSummary, PackSummary, VocabularyItem } from "../../types/models";

function buildDataUrl(baseUrl: string, fileName: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}data/${fileName}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }

  return (await response.json()) as T;
}

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function getDatasetLoadErrorMessage(error: unknown, offline = isOffline()): string {
  if (offline) {
    return "You appear to be offline and this vocabulary library is not available offline yet. Load it once online first.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load vocabulary library.";
}

export async function loadAppDataset(baseUrl = import.meta.env.BASE_URL): Promise<AppDataset> {
  const [levels, packs, vocabItems] = await Promise.all([
    fetchJson<LevelSummary[]>(buildDataUrl(baseUrl, "levels.json")),
    fetchJson<PackSummary[]>(buildDataUrl(baseUrl, "packs.json")),
    fetchJson<VocabularyItem[]>(buildDataUrl(baseUrl, "vocab_master.json")),
  ]);

  return {
    levels,
    packs,
    vocabItems,
  };
}

export { buildDataUrl };
