import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantSlug = "demo-school";

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug }
  });

  if (!tenant) throw new Error("Tenant not found");

  const parentUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "parent1@demo-school.edu" }
  });

  if (!parentUser) throw new Error("parent1 user not found");

  const studentUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: "student1@demo-school.edu" }
  });

  if (!studentUser) throw new Error("student1 user not found");

  const student = await prisma.student.findFirst({
    where: { tenantId: tenant.id, userId: studentUser.id }
  });

  if (!student) throw new Error("student1 student record not found");

  // Create or update Guardian link
  const guardian = await prisma.guardian.findFirst({
    where: { tenantId: tenant.id, studentId: student.id }
  });

  if (guardian) {
    console.log("Updating existing guardian record...");
    await prisma.guardian.update({
      where: { id: guardian.id },
      data: { userId: parentUser.id }
    });
  } else {
    console.log("Creating new guardian record...");
    await prisma.guardian.create({
      data: {
        tenantId: tenant.id,
        studentId: student.id,
        userId: parentUser.id,
        name: parentUser.name || "Parent One",
        relation: "Father",
        phone: "0300-1110001",
        email: "parent1@demo-school.edu",
        isEmergency: true
      }
    });
  }

  console.log("✅ Successfully attached student1 to parent1!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
