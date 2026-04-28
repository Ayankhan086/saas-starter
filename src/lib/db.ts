import prisma from "./prisma";
import { PLANS, type PlanKey } from "./plans";

/**
 * Returns all tenant-scoped query helpers bound to a specific orgId.
 * All queries that touch tenant data MUST go through this helper —
 * never add raw orgId filters directly in route handlers.
 */
export function tenantDb(orgId: string) {
  return {
    workspaces: {
      findMany: () =>
        prisma.workspace.findMany({
          where: { orgId },
          orderBy: { createdAt: "desc" },
        }),
      findFirst: (id: string) =>
        prisma.workspace.findFirst({
          where: { id, orgId },
        }),
      count: () => prisma.workspace.count({ where: { orgId } }),
      create: (name: string) =>
        prisma.workspace.create({ data: { name, orgId } }),
      delete: (id: string) =>
        prisma.workspace.delete({ where: { id, orgId } }),
    },
    members: {
      findMany: () =>
        prisma.membership.findMany({
          where: { orgId },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        }),
      findByUserId: (userId: string) =>
        prisma.membership.findUnique({
          where: { userId_orgId: { userId, orgId } },
        }),
      count: () => prisma.membership.count({ where: { orgId } }),
    },
    tasks: {
      findMany: (workspaceId: string) =>
        prisma.task.findMany({
          where: { workspaceId, workspace: { orgId } },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
    },
    subscription: {
      findOrThrow: () =>
        prisma.subscription.findUniqueOrThrow({ where: { orgId } }),
      findFirst: () =>
        prisma.subscription.findUnique({ where: { orgId } }),
    },
  };
}

export type TenantDb = ReturnType<typeof tenantDb>;
