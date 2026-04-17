import { describe, expect, it } from "vitest";
import { buildNotifications, chooseCheaperOffer } from "./choose-cheaper-offer";

describe("chooseCheaperOffer", () => {
  it("selects the lower eligible store price and emits a price-drop alert", () => {
    const winner = chooseCheaperOffer([
      { store: "coupang", price: 8990, eligible: true },
      { store: "ssg", price: 7990, eligible: true },
    ]);

    const notifications = buildNotifications({
      previous: { store: "ssg", price: 8990, isOnSale: false },
      current: { store: "ssg", price: 7990, isOnSale: true },
    });

    expect(winner?.store).toBe("ssg");
    expect(notifications.map((item) => item.type)).toEqual(["sale_started", "price_dropped"]);
  });
});
