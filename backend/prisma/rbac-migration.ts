/**
 * One-time RBAC data migration.
 * For each org: for each non-owner user, create ProjectMember rows for all active projects.
 * - Old 'admin' users → project role 'admin'
 * - Old 'member' users → project role 'editor'
 * - Then update all User.role = 'admin' to 'member'
 * - Owners get NO rows (implicit access)
 *
 * Usage: npx ts-node prisma/rbac-migration.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      users: true,
      projects: { where: { status: { not: 'archived' } } },
    },
  });

  let membershipsCreated = 0;
  let adminsConverted = 0;

  for (const org of orgs) {
    const nonOwnerUsers = org.users.filter((u) => u.role !== 'owner');

    for (const user of nonOwnerUsers) {
      const projectRole = user.role === 'admin' ? 'admin' : 'editor';

      for (const project of org.projects) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: user.id } },
          update: {},
          create: { projectId: project.id, userId: user.id, role: projectRole },
        });
        membershipsCreated++;
      }
    }
  }

  // Convert all 'admin' org roles to 'member'
  const updated = await prisma.user.updateMany({
    where: { role: 'admin' },
    data: { role: 'member' },
  });
  adminsConverted = updated.count;

  console.log(`RBAC migration complete:`);
  console.log(`  ${membershipsCreated} project memberships created`);
  console.log(`  ${adminsConverted} admin users converted to member`);
}

main()
  .catch((e) => {
    console.error('RBAC migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
