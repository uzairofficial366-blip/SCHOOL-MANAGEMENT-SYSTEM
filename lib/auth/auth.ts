import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
  tenantSlug: z.string().min(1),
  totpCode: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      async authorize(credentials) {
        try {
          console.log("AUTHORIZE CALLED with: " + JSON.stringify(credentials));
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("Parse failed: " + JSON.stringify(parsed.error));
            return null;
          }

          const { email, password, tenantSlug, totpCode } = parsed.data;

          const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug, isActive: true },
          });
          if (!tenant) {
            console.error("Tenant not found: " + tenantSlug);
            return null;
          }

          let user = await prisma.user.findFirst({
            where: { tenantId: tenant.id, email, isActive: true, deletedAt: null },
          });

          if (!user) {
            const staff = await prisma.staff.findFirst({
              where: { tenantId: tenant.id, employeeId: email, deletedAt: null },
              include: { user: true },
            });
            if (staff && staff.user.isActive && !staff.user.deletedAt) {
              user = staff.user;
            } else {
              const student = await prisma.student.findFirst({
                where: { tenantId: tenant.id, admissionNo: email, deletedAt: null },
                include: { user: true },
              });
              if (student && student.user.isActive && !student.user.deletedAt) {
                user = student.user;
              }
            }
          }

          if (!user) {
            console.error("User not found: " + email);
            return null;
          }

          if (!user?.passwordHash) {
            console.error("User missing passwordHash: " + email);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            console.error("Invalid password for: " + email);
            return null;
          }

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
            role:        user.role,
            tenantId:    tenant.id,
            tenantSlug:  tenant.slug,
            tenantName:  tenant.name,
          };
        } catch (error: any) {
          console.error("Login Error:", error);
          console.error(new Date().toISOString() + " - " + error.stack);
          return null;
        }
      },
    }),
  ],
});
