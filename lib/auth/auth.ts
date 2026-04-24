import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
  totpCode: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "fallback_secret_for_development_only_1234567890",
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email:      { label: "Email",       type: "email" },
        password:   { label: "Password",    type: "password" },
        tenantSlug: { label: "School Code", type: "text" },
        totpCode:   { label: "MFA Code",    type: "text" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password, tenantSlug, totpCode } = parsed.data;

          // Resolve tenant
          const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug, isActive: true },
          });
          if (!tenant) return null;

          // Resolve user
          const user = await prisma.user.findFirst({
            where: { tenantId: tenant.id, email, isActive: true, deletedAt: null },
          });
          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          // MFA check (optional — skip if not configured)
          if (user.mfaEnabled && user.mfaSecret) {
            if (!totpCode) throw new Error("MFA_REQUIRED");
            const speakeasy = (await import("speakeasy")).default;
            const verified = speakeasy.totp.verify({
              secret: user.mfaSecret,
              encoding: "base32",
              token: totpCode,
              window: 1,
            });
            if (!verified) throw new Error("Invalid MFA code");
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id:          user.id,
            email:       user.email,
            name:        user.name,
            image:       user.avatarUrl,
            role:        user.role,
            tenantId:    tenant.id,
            tenantSlug:  tenant.slug,
            tenantName:  tenant.name,
          };
        } catch (error) {
          console.error("Login Error in NextAuth authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role       = (user as any).role;
        token.tenantId   = (user as any).tenantId;
        token.tenantSlug = (user as any).tenantSlug;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role       = token.role;
      (session.user as any).tenantId   = token.tenantId;
      (session.user as any).tenantSlug = token.tenantSlug;
      (session.user as any).tenantName = token.tenantName;
      return session;
    },
  },
});

export const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN:    ["/super-admin"],
  ADMIN:          ["/admin"],
  TEACHER:        ["/teacher"],
  STUDENT:        ["/student"],
  PARENT:         ["/parent"],
  ACCOUNTANT:     ["/accountant"],
  RECEPTIONIST:   ["/receptionist"],
  LIBRARIAN:      ["/librarian"],
  EXAM_CONTROLLER:["/exam-controller"],
  STORE_MANAGER:  ["/store"],
  HOSTEL_WARDEN:  ["/hostel"],
  DRIVER:         ["/transport"],
};
