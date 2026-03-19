import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../app/App";

function createJsonResponse<T>(payload: T, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

const testDataset = {
  levels: [{ id: "A1", label: "A1", description: "Beginner" }],
  packs: [{ id: "a1_core", title: "A1 Core", description: "Core", cefrLevel: "A1", itemCount: 2, tags: [] }],
  vocabItems: [
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
    {
      id: "sv_000002",
      lemma: "bok",
      swedish: "bok",
      english: ["book"],
      partOfSpeech: "noun",
      frequencyRank: 2,
      cefrLevel: "A1",
      packIds: ["a1_core"],
      tags: ["common"],
      priority: 5,
      sources: [{ name: "seed", sourceId: "2" }],
    },
  ],
};

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitFor(assertion: () => void): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      assertion();
      return;
    } catch (error) {
      if (attempt === 19) {
        throw error;
      }
      await flush();
    }
  }
}

describe("App runtime dataset loading", () => {
  let container: HTMLDivElement;
  let root: Root;
  const reactTestGlobals = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };

  beforeEach(() => {
    reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(container);
    root = createRoot(container);
    window.localStorage.clear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    reactTestGlobals.IS_REACT_ACT_ENVIRONMENT = false;
    vi.unstubAllGlobals();
  });

  it("renders after loading the dataset and starts a study session", async () => {
    const fetchMock = vi.fn<(input: string) => Promise<Response>>((input) => {
      if (input.endsWith("levels.json")) {
        return Promise.resolve(createJsonResponse(testDataset.levels));
      }
      if (input.endsWith("packs.json")) {
        return Promise.resolve(createJsonResponse(testDataset.packs));
      }

      return Promise.resolve(createJsonResponse(testDataset.vocabItems));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<App />);
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Daily review");
      expect(container.textContent).toContain("Start study");
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Start study",
    );
    expect(startButton).toBeDefined();

    await act(async () => {
      startButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Study");
      expect(container.textContent).toContain("Card 1 of 2");
    });
  });

  it("shows an error state and retries successfully", async () => {
    let shouldFail = true;
    const fetchMock = vi.fn<(input: string) => Promise<Response>>((input) => {
      if (shouldFail && input.endsWith("levels.json")) {
        return Promise.resolve(createJsonResponse({ error: "missing" }, false, 500));
      }
      if (input.endsWith("levels.json")) {
        return Promise.resolve(createJsonResponse(testDataset.levels));
      }
      if (input.endsWith("packs.json")) {
        return Promise.resolve(createJsonResponse(testDataset.packs));
      }

      return Promise.resolve(createJsonResponse(testDataset.vocabItems));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<App />);
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Could not load the vocabulary library");
      expect(container.textContent).toContain("Retry");
    });

    shouldFail = false;
    const retryButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Retry",
    );
    expect(retryButton).toBeDefined();

    await act(async () => {
      retryButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await waitFor(() => {
      expect(container.textContent).toContain("Daily review");
      expect(container.textContent).toContain("Start study");
    });
  });
});
