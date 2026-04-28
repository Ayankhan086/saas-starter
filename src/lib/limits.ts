import prisma from "./prisma";
import { PLANS } from "./plans";
import type { Plan } from "@/generated/prisma/client";

type LimitResource = "members" | "workspaces";

/**
 * Checks whether the org has room to create another resource based on their plan.
 * Returns { allowed: true } or { allowed: false, limit: number, plan: PlanKey }.
 * Call this server-side before creating any member or workspace.
 */
export async function checkPlanLimit(
  orgId: string,
  resource: LimitResource
): Promise<
  | { allowed: true }
  | { allowed: false; limit: number; plan: Plan }
> {
  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
  });

  const plan: Plan = subscription?.plan ?? "FREE";
  const limits = PLANS[plan];

  if (resource === "members") {
    const count = await prisma.membership.count({ where: { orgId } });
    if (count >= limits.maxMembers) {
      return { allowed: false, limit: limits.maxMembers, plan };
    }
  }

  if (resource === "workspaces") {
    const count = await prisma.workspace.count({ where: { orgId } });
    if (count >= limits.maxWorkspaces) {
      return { allowed: false, limit: limits.maxWorkspaces, plan };
    }
  }

  return { allowed: true };
}
