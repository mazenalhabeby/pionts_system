/**
 * One-time RBAC data migration (COMPLETED — kept for reference only).
 *
 * This migration was run before the multi-org membership migration.
 * It created ProjectMember rows for non-owner users and converted
 * 'admin' org roles to 'member'.
 *
 * Since the schema has changed (User no longer has orgId/role fields,
 * replaced by OrgMembership join table), this script would need to be
 * rewritten if re-run. It is preserved only as documentation.
 *
 * Original usage: npx ts-node prisma/rbac-migration.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      memberships: { include: { user: true } },
      projects: { where: { status: { not: 'archived' } } },
    },
  });

  let membershipsCreated = 0;

  for (const org of orgs) {
    const nonOwnerMemberships = org.memberships.filter((m) => m.role !== 'owner');

    for (const membership of nonOwnerMemberships) {
      const projectRole = 'editor';

      for (const project of org.projects) {
        await prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: membership.userId } },
          update: {},
          create: { projectId: project.id, userId: membership.userId, role: projectRole },
        });
        membershipsCreated++;
      }
    }
  }

  console.log(`RBAC migration complete:`);
  console.log(`  ${membershipsCreated} project memberships created`);
}

main()
  .catch((e) => {
    console.error('RBAC migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
