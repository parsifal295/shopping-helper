import { describe, expect, it, vi } from "vitest";
import { refreshWatchlistItem } from "./refresh-watchlist-item";

describe("refreshWatchlistItem", () => {
  it("saves eligible offers, emits notifications, and marks sync success", async () => {
    const saveSnapshot = vi.fn(async () => undefined);
    const createNotification = vi.fn(
      async (_input: { type: "sale_started" | "price_dropped" }) => undefined,
    );
    const logCollectionEvent = vi.fn();
    const updateSyncState = vi.fn(async () => undefined);
    const loadPreviousSnapshot = vi
      .fn()
      .mockResolvedValueOnce({ price: 6990, isOnSale: false })
      .mockResolvedValueOnce(null);

    await refreshWatchlistItem(
      {
        loadWatchlistItem: async () => ({
          userId: "user-1",
          canonicalProductId: "product-1",
          pollingIntervalMinutes: 60,
          encryptedSessionJsonByStore: {
            coupang: "enc-coupang",
            ssg: "enc-ssg",
          },
          storeReferences: [
            { store: "coupang", productUrl: "https://www.coupang.com/products/1" },
            { store: "ssg", productUrl: "https://www.ssg.com/item/itemView.ssg?itemId=2" },
          ],
        }),
        loadPreviousSnapshot,
        saveSnapshot,
        createNotification,
        logCollectionEvent,
        updateSyncState,
        collectOffer: vi
          .fn()
          .mockResolvedValueOnce({
            price: 5990,
            listPrice: 6990,
            isOnSale: true,
            availability: "available",
            deliveryType: "rocket_fresh",
            rawTitle: "비비고 왕교자",
            rawPayload: {},
            eligible: true,
          })
          .mockResolvedValueOnce({
            price: 6490,
            listPrice: null,
            isOnSale: false,
            availability: "available",
            deliveryType: "daytime",
            rawTitle: "비비고 왕교자",
            rawPayload: {},
            eligible: true,
          }),
      },
      "watch-1",
      new Date("2026-04-17T08:00:00.000Z"),
    );

    expect(saveSnapshot).toHaveBeenCalledTimes(2);
    expect(logCollectionEvent).toHaveBeenNthCalledWith(1, {
      watchlistItemId: "watch-1",
      store: "coupang",
      status: "success",
    });
    expect(logCollectionEvent).toHaveBeenNthCalledWith(2, {
      watchlistItemId: "watch-1",
      store: "ssg",
      status: "success",
    });
    expect(createNotification.mock.calls.map((call) => call[0]?.type)).toEqual(["sale_started", "price_dropped"]);
    expect(updateSyncState).toHaveBeenCalledWith({
      watchlistItemId: "watch-1",
      lastRunAt: new Date("2026-04-17T08:00:00.000Z"),
      nextRunAt: new Date("2026-04-17T09:00:00.000Z"),
      lastStatus: "success",
      lastErrorCode: null,
    });
  });

  it("marks sync partial when one store fails but another succeeds", async () => {
    const saveSnapshot = vi.fn(async () => undefined);
    const logCollectionEvent = vi.fn();
    const updateSyncState = vi.fn(async () => undefined);

    await refreshWatchlistItem(
      {
        loadWatchlistItem: async () => ({
          userId: "user-1",
          canonicalProductId: "product-1",
          pollingIntervalMinutes: 30,
          encryptedSessionJsonByStore: {
            coupang: "enc-coupang",
            ssg: "enc-ssg",
          },
          storeReferences: [
            { store: "coupang", productUrl: "https://www.coupang.com/products/1" },
            { store: "ssg", productUrl: "https://www.ssg.com/item/itemView.ssg?itemId=2" },
          ],
        }),
        loadPreviousSnapshot: vi.fn().mockResolvedValue(null),
        saveSnapshot,
        createNotification: vi.fn(async () => undefined),
        logCollectionEvent,
        updateSyncState,
        collectOffer: vi
          .fn()
          .mockRejectedValueOnce(new Error("parser_miss"))
          .mockResolvedValueOnce({
            price: 6490,
            listPrice: null,
            isOnSale: false,
            availability: "available",
            deliveryType: "daytime",
            rawTitle: "비비고 왕교자",
            rawPayload: {},
            eligible: true,
          }),
      },
      "watch-1",
      new Date("2026-04-17T08:00:00.000Z"),
    );

    expect(saveSnapshot).toHaveBeenCalledTimes(1);
    expect(logCollectionEvent).toHaveBeenNthCalledWith(1, {
      watchlistItemId: "watch-1",
      store: "coupang",
      status: "error",
      errorCode: "collect_coupang",
    });
    expect(logCollectionEvent).toHaveBeenNthCalledWith(2, {
      watchlistItemId: "watch-1",
      store: "ssg",
      status: "success",
    });
    expect(updateSyncState).toHaveBeenCalledWith({
      watchlistItemId: "watch-1",
      lastRunAt: new Date("2026-04-17T08:00:00.000Z"),
      nextRunAt: new Date("2026-04-17T08:30:00.000Z"),
      lastStatus: "partial",
      lastErrorCode: "collect_coupang",
    });
  });
});
