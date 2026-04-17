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
    await db
      .insert(linkedStoreAccounts)
      .values({
        userId: input.userId,
        store: input.store,
        encryptedSessionJson: input.encryptedSessionJson,
        sessionStatus: input.sessionStatus ?? "active",
      })
      .onConflictDoUpdate({
        target: [linkedStoreAccounts.userId, linkedStoreAccounts.store],
        set: {
          encryptedSessionJson: input.encryptedSessionJson,
          sessionStatus: input.sessionStatus ?? "active",
          lastValidatedAt: null,
          reauthRequiredAt: null,
        },
      });

    return db.query.linkedStoreAccounts.findFirst({
      where: and(eq(linkedStoreAccounts.userId, input.userId), eq(linkedStoreAccounts.store, input.store)),
    });
  },
};
