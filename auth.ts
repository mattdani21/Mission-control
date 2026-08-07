import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { PgAuthRepository } from "./lib/auth/repository";
import { authenticateUser } from "./lib/auth/service";
import { loginSchema } from "./lib/auth/validation";

const repo = new PgAuthRepository();

// Auth.js v5 (next-auth@beta), Credentials provider with JWT sessions.
// Sessions are short-lived JWTs signed with AUTH_SECRET; user identity is
// re-validated against the database on every sign-in.
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await authenticateUser(repo, parsed.data.email, parsed.data.password);
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `sub` is Auth.js's standard user-identifier claim; it is typed on the
      // base JWT, so no module augmentation is required.
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
