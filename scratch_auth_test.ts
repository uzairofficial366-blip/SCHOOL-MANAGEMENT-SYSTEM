import 'dotenv/config';
import { prisma } from './lib/db/prisma';
import bcrypt from 'bcryptjs';

async function testAuth() {
  const email = "admin@demo-school.edu";
  const password = "Admin@1234";
  const tenantSlug = "demo-school";

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug, isActive: true },
  });
  console.log("Tenant found:", !!tenant);
  if (!tenant) return;

  let user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email, isActive: true, deletedAt: null },
  });

  console.log("User found:", !!user);
  if (!user) {
    const staff = await prisma.staff.findFirst({
      where: { tenantId: tenant.id, employeeId: email, deletedAt: null },
      include: { user: true },
    });
    if (staff && staff.user.isActive && !staff.user.deletedAt) {
      user = staff.user;
      console.log("User found via staff");
    } else {
      const student = await prisma.student.findFirst({
        where: { tenantId: tenant.id, admissionNo: email, deletedAt: null },
        include: { user: true },
      });
      if (student && student.user.isActive && !student.user.deletedAt) {
        user = student.user;
        console.log("User found via student");
      }
    }
  }

  if (!user) {
    console.log("User not found!");
    return;
  }
  console.log("Password hash exists:", !!user.passwordHash);

  const valid = await bcrypt.compare(password, user.passwordHash!);
  console.log("Password valid:", valid);
}

testAuth().catch(console.error).finally(() => prisma.$disconnect());
