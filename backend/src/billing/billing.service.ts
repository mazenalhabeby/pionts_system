import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS, PlanType } from './billing.constants';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscription(orgId: number) {
    return this.prisma.subscription.findUnique({ where: { orgId } });
  }

  getOrgPlan(subscription: { plan: string } | null): PlanType {
    if (!subscription) return 'free';
    return (subscription.plan as PlanType) in PLAN_LIMITS
      ? (subscription.plan as PlanType)
      : 'free';
  }

  async getUsage(orgId: number) {
    const projects = await this.prisma.project.findMany({
      where: { orgId, status: { not: 'archived' } },
      select: { id: true },
    });

    const projectCount = projects.length;
    let maxCustomers = 0;

    if (projectCount > 0) {
      const counts = await this.prisma.customer.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projects.map((p) => p.id) } },
        _count: true,
      });
      for (const c of counts) {
        if (c._count > maxCustomers) maxCustomers = c._count;
      }
    }

    return { projectCount, maxCustomersInProject: maxCustomers };
  }

  async canCreateProject(orgId: number): Promise<void> {
    const sub = await this.getSubscription(orgId);
    const plan = this.getOrgPlan(sub);
    const limits = PLAN_LIMITS[plan];

    const projectCount = await this.prisma.project.count({
      where: { orgId, status: { not: 'archived' } },
    });

    if (projectCount >= limits.maxProjects) {
      throw new ForbiddenException(
        `Your ${limits.label} plan allows ${limits.maxProjects} project(s). Upgrade to Pro for unlimited projects.`,
      );
    }
  }

  async canCreateCustomer(projectId: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { orgId: true },
    });
    if (!project) return;

    const sub = await this.getSubscription(project.orgId);
    const plan = this.getOrgPlan(sub);
    const limits = PLAN_LIMITS[plan];

    if (limits.maxCustomersPerProject === Infinity) return;

    const customerCount = await this.prisma.customer.count({ where: { projectId } });
    if (customerCount >= limits.maxCustomersPerProject) {
      throw new ForbiddenException(
        `Your ${limits.label} plan allows ${limits.maxCustomersPerProject} customers per project. Upgrade to Pro for unlimited.`,
      );
    }
  }

  async handleSubscriptionUpdated(
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    plan: string,
    status: string,
    currentPeriodEnd: Date | null,
  ) {
    await this.prisma.subscription.update({
      where: { stripeCustomerId },
      data: { stripeSubscriptionId, plan, status, currentPeriodEnd },
    });
  }

  async handleSubscriptionDeleted(stripeCustomerId: string) {
    await this.prisma.subscription.update({
      where: { stripeCustomerId },
      data: { plan: 'free', status: 'canceled', stripeSubscriptionId: null },
    });
  }
}
