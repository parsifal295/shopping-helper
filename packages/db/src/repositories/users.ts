import { eq } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";

export const usersRepository = {
  async findByEmail(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    return user ?? null;
  },
};
