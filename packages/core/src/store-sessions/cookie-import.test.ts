import { describe, expect, it } from "vitest";
import { decryptSessionJson, encryptSessionJson } from "./crypto";
import { parseCookieImport } from "./cookie-import";

describe("store session import", () => {
  it("parses browser cookies and round-trips encrypted payloads", () => {
    const cookies = parseCookieImport(
      JSON.stringify([
        {
          name: "SID",
          value: "abc",
          domain: ".ssg.com",
          path: "/",
          secure: true,
          httpOnly: true,
        },
      ]),
    );

    const encrypted = encryptSessionJson(
      JSON.stringify(cookies),
      "12345678901234567890123456789012",
    );

    expect(cookies[0].domain).toBe(".ssg.com");
    expect(decryptSessionJson(encrypted, "12345678901234567890123456789012")).toContain("\"SID\"");
  });
});
