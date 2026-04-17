import { afterEach, describe, expect, it, vi } from "vitest";
import { encryptSessionJson } from "@shopping/core";
import { collectSsgOffer } from "./ssg/collect-offer";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("collectSsgOffer", () => {
  it("rejects delivery types outside dawn/daytime/traders", async () => {
    global.fetch = vi.fn<typeof fetch>(
      async () =>
        new Response(`
          <html>
            <body>
              <span class="delivery-type">택배배송</span>
              <span class="ssg_price">7,990원</span>
              <span class="ssg_list_price">8,990원</span>
            </body>
          </html>
        `),
    );

    const encryptedSessionJson = encryptSessionJson(
      JSON.stringify([{ name: "SID", value: "abc", domain: ".ssg.com", path: "/", secure: true, httpOnly: true }]),
      "12345678901234567890123456789012",
    );

    const offer = await collectSsgOffer({
      productUrl: "https://www.ssg.com/item/itemView.ssg?itemId=1",
      encryptedSessionJson,
      encryptionKey: "12345678901234567890123456789012",
    });

    expect(offer.deliveryType).toBe("other");
    expect(offer.eligible).toBe(false);
  });
});
