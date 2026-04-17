import { afterEach, describe, expect, it, vi } from "vitest";
import { logCollectionEvent } from "./collection-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logCollectionEvent", () => {
  it("writes structured collection events to stdout", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    logCollectionEvent({
      watchlistItemId: "watch-1",
      store: "ssg",
      status: "error",
      errorCode: "collect_ssg",
    });

    expect(info).toHaveBeenCalledWith(
      "collection_event",
      JSON.stringify({
        watchlistItemId: "watch-1",
        store: "ssg",
        status: "error",
        errorCode: "collect_ssg",
      }),
    );
  });
});
