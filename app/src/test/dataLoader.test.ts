import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildDataUrl,
  getDatasetLoadErrorMessage,
  loadAppDataset,
} from "../lib/data/loadAppDataset";

function createJsonResponse<T>(payload: T, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

describe("app dataset loader", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds data urls from the configured base path", () => {
    expect(buildDataUrl("/swe-vocab/", "vocab_master.json")).toBe("/swe-vocab/data/vocab_master.json");
    expect(buildDataUrl("/", "packs.json")).toBe("/data/packs.json");
  });

  it("loads levels, packs, and vocab items", async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>((input) => {
      if (input.endsWith("levels.json")) {
        return Promise.resolve(createJsonResponse([{ id: "A1", label: "A1", description: "Beginner" }]));
      }
      if (input.endsWith("packs.json")) {
        return Promise.resolve(
          createJsonResponse([{ id: "a1_core", title: "A1 Core", description: "Core", cefrLevel: "A1", itemCount: 1, tags: [] }]),
        );
      }

      return Promise.resolve(
        createJsonResponse([
          {
            id: "sv_000001",
            lemma: "dag",
            swedish: "dag",
            english: ["day"],
            partOfSpeech: "noun",
            frequencyRank: 1,
            cefrLevel: "A1",
            packIds: ["a1_core"],
            tags: ["common"],
            priority: 5,
            sources: [{ name: "seed", sourceId: "1" }],
          },
        ]),
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    const dataset = await loadAppDataset("/swe-vocab/");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(dataset.levels).toHaveLength(1);
    expect(dataset.packs).toHaveLength(1);
    expect(dataset.vocabItems).toHaveLength(1);
  });

  it("fails when one of the files cannot be loaded", async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>((input) => {
      if (input.endsWith("packs.json")) {
        return Promise.resolve(createJsonResponse({ error: "missing" }, false, 404));
      }

      return Promise.resolve(createJsonResponse([]));
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(loadAppDataset("/")).rejects.toThrow("packs.json");
  });

  it("returns an offline-specific message when the first load fails offline", () => {
    expect(getDatasetLoadErrorMessage(new Error("network"), true)).toContain("not available offline yet");
  });
});
