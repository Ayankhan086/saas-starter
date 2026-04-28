import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const email = "demo@teamspace.dev";

    // Check if demo account already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "Demo account already exists!" });
    }

    const hashedPassword = await bcrypt.hash("Demo1234!", 12);

    // Create the full demo account structure
    await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: "Demo User",
          email,
          password: hashedPassword,
        },
      });

      // 2. Create Organization
      const org = await tx.organization.create({
        data: {
          name: "Acme Corp (Demo)",
          slug: "acme-corp-demo",
        },
      });

      // 3. Create Membership (Owner)
      await tx.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: "OWNER",
        },
      });

      // 4. Create Subscription (PRO plan for the demo to show all features)
      await tx.subscription.create({
        data: {
          orgId: org.id,
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      // 5. Create a Sample Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: "Website Redesign",
          orgId: org.id,
        },
      });

      // 6. Create some sample tasks
      await tx.task.createMany({
        data: [
          {
            title: "Design new landing page",
            status: "DONE",
            priority: "HIGH",
            workspaceId: workspace.id,
            assigneeId: user.id,
            creatorId: user.id,
          },
          {
            title: "Implement authentication",
            status: "IN_PROGRESS",
            priority: "HIGH",
            workspaceId: workspace.id,
            assigneeId: user.id,
            creatorId: user.id,
          },
          {
            title: "Write documentation",
            status: "TODO",
            priority: "MEDIUM",
            workspaceId: workspace.id,
            assigneeId: user.id,
            creatorId: user.id,
          },
          {
            title: "Fix responsive layout bugs",
            status: "TODO",
            priority: "HIGH",
            workspaceId: workspace.id,
            creatorId: user.id,
          },
        ],
      });
    });

    return NextResponse.json({ message: "✅ Demo account successfully created!" });
  } catch (error: any) {
    console.error("[SETUP_DEMO_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
