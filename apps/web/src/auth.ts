import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { usersRepository } from "@shopping/db";
import { authorizeUser } from "@/lib/authorize-user";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      authorize: async (credentials) =>
        authorizeUser(usersRepository, {
          email: String(credentials?.email ?? ""),
          password: String(credentials?.password ?? ""),
        }),
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
      }

      return session;
    },
  },
});
