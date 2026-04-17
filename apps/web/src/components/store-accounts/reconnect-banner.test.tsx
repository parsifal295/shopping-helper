import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReconnectBanner } from "./reconnect-banner";

describe("ReconnectBanner", () => {
  it("shows a reconnect call-to-action when a store session expires", () => {
    const html = renderToStaticMarkup(<ReconnectBanner store="ssg" />);
    expect(html).toContain("Reconnect SSG");
  });
});
