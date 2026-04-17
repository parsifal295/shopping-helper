import { compare } from "bcryptjs";

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
};

export async function authorizeUser(
  repo: { findByEmail(email: string): Promise<UserRecord | null> },
  credentials: { email: string; password: string },
) {
  const user = await repo.findByEmail(credentials.email);
  if (!user) {
    return null;
  }

  const matches = await compare(credentials.password, user.passwordHash);
  if (!matches) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
  };
}
