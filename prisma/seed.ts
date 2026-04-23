import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-school" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo-school",
      locale: "en",
      timezone: "Asia/Karachi",
      isActive: true,
    },
  });
  console.log("✅ Tenant:", tenant.slug);

  const hash = await bcrypt.hash("Admin@1234", 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo-school.edu" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo-school.edu",
      name: "School Administrator",
      passwordHash: hash,
      role: "ADMIN",
      isActive: true,
      mfaEnabled: false,
    },
  });
  console.log("✅ Admin:", admin.email);

  const teacherUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "teacher@demo-school.edu" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "teacher@demo-school.edu",
      name: "Ms. Sarah Khan",
      passwordHash: hash,
      role: "TEACHER",
      isActive: true,
    },
  });
  await prisma.staff.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: teacherUser.id,
      employeeId: "EMP-001",
      department: "Science",
      designation: "Senior Teacher",
    },
  });
  console.log("✅ Teacher:", teacherUser.email);

  const studentUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "student@demo-school.edu" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "student@demo-school.edu",
      name: "Ahmed Ali",
      passwordHash: hash,
      role: "STUDENT",
      isActive: true,
    },
  });
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: studentUser.id,
      admissionNo: "ADM-2024-001",
      gender: "male",
    },
  });
  console.log("✅ Student:", studentUser.email);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials:");
  console.log("   School Code : demo-school");
  console.log("   Admin       : admin@demo-school.edu  / Admin@1234");
  console.log("   Teacher     : teacher@demo-school.edu / Admin@1234");
  console.log("   Student     : student@demo-school.edu / Admin@1234");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
