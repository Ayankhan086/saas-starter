import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Only owners can update organization settings" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const org = await prisma.organization.update({
    where: { id: session.user.orgId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json(org);
}
