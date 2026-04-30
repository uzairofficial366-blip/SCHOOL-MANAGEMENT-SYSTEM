import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || "fallback_secret_for_development_only_1234567890",
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [], // Providers are added in the main auth.ts to avoid Edge runtime issues
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.role       = (user as any).role;
        token.tenantId   = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id         = token.id;
        (session.user as any).role       = token.role;
        (session.user as any).tenantId   = token.tenantId;
        (session.user as any).tenantSlug = token.tenantSlug;
        (session.user as any).tenantName = token.tenantName;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
