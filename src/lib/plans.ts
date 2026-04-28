export const PLANS = {
  FREE: {
    maxMembers: 3,
    maxWorkspaces: 2,
    billingPortal: false,
  },
  PRO: {
    maxMembers: 20,
    maxWorkspaces: 10,
    billingPortal: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
