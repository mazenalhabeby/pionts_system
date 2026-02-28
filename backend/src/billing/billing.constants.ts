export const PLAN_LIMITS = {
  free: { maxProjects: Infinity, maxCustomersPerProject: Infinity, label: 'Free', priceMonthly: 0 },
  pro: { maxProjects: Infinity, maxCustomersPerProject: Infinity, label: 'Pro', priceMonthly: 29 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
