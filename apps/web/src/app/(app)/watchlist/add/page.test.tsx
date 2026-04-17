import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AddWatchlistPage from "./page";

describe("AddWatchlistPage", () => {
  it("renders both search and url forms", () => {
    const html = renderToStaticMarkup(<AddWatchlistPage />);

    expect(html).toContain("Search products");
    expect(html).toContain("Add from URL");
  });
});
