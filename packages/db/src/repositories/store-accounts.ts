import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { linkedStoreAccounts } from "../schema";

type Store = "coupang" | "ssg";

export const storeAccountsRepository = {
  async listByUserId(userId: string) {
    return db.query.linkedStoreAccounts.findMany({
      where: eq(linkedStoreAccounts.userId, userId),
      orderBy: (table, { asc }) => [asc(table.store)],
    });
  },

  async upsert(input: {
    userId: string;
    store: Store;
    encryptedSessionJson: string;
    sessionStatus?: "active" | "reauth_required";
  }) {
    const validatedAt = input.sessionStatus === "reauth_required" ? null : new Date();
    const reauthRequiredAt = input.sessionStatus === "reauth_required" ? new Date() : null;

    await db
      .insert(linkedStoreAccounts)
      .values({
        userId: input.userId,
        store: input.store,
        encryptedSessionJson: input.encryptedSessionJson,
        sessionStatus: input.sessionStatus ?? "active",
        lastValidatedAt: validatedAt,
        reauthRequiredAt,
      })
      .onConflictDoUpdate({
        target: [linkedStoreAccounts.userId, linkedStoreAccounts.store],
        set: {
          encryptedSessionJson: input.encryptedSessionJson,
          sessionStatus: input.sessionStatus ?? "active",
          lastValidatedAt: validatedAt,
          reauthRequiredAt,
        },
      });

    return db.query.linkedStoreAccounts.findFirst({
      where: and(eq(linkedStoreAccounts.userId, input.userId), eq(linkedStoreAccounts.store, input.store)),
    });
  },

  async setSessionStatus(input: {
    userId: string;
    store: Store;
    sessionStatus: "active" | "reauth_required";
  }) {
    const [account] = await db
      .update(linkedStoreAccounts)
      .set({
        sessionStatus: input.sessionStatus,
        lastValidatedAt: input.sessionStatus === "active" ? new Date() : null,
        reauthRequiredAt: input.sessionStatus === "reauth_required" ? new Date() : null,
      })
      .where(and(eq(linkedStoreAccounts.userId, input.userId), eq(linkedStoreAccounts.store, input.store)))
      .returning();

    return account ?? null;
  },
};
