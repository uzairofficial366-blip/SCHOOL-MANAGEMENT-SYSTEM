import 'dotenv/config';
import { prisma } from './lib/db/prisma';
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true, tenantId: true, isActive: true, deletedAt: true } });
  console.log('Users:', users);
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', tenants);
}
main().catch(console.error).finally(() => prisma.$disconnect());
