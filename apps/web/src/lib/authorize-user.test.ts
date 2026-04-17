import { hash } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { authorizeUser } from "./authorize-user";

describe("authorizeUser", () => {
  it("returns a safe user object when the password matches", async () => {
    const passwordHash = await hash("hunter2", 10);

    const result = await authorizeUser(
      {
        findByEmail: async () => ({
          id: "user-1",
          email: "owner@example.com",
          displayName: "Owner",
          passwordHash,
        }),
      },
      { email: "owner@example.com", password: "hunter2" },
    );

    expect(result).toEqual({
      id: "user-1",
      email: "owner@example.com",
      name: "Owner",
    });
  });
});
