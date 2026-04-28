import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = slugify(base);
  let existing = await prisma.organization.findUnique({ where: { slug } });
  let counter = 1;
  while (existing) {
    slug = `${slugify(base)}-${counter++}`;
    existing = await prisma.organization.findUnique({ where: { slug } });
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, orgName } = parsed.data;

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    // Use orgName (not user's name) for the slug — orgs have their own identity
    const slug = await uniqueSlug(orgName);

    // Atomic transaction: create User + Organization + Membership + Subscription
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, password: hashedPassword },
      });

      const org = await tx.organization.create({
        data: { name: orgName, slug },
      });

      await tx.membership.create({
        data: { userId: user.id, orgId: org.id, role: "OWNER" },
      });

      await tx.subscription.create({
        data: { orgId: org.id, plan: "FREE", status: "ACTIVE" },
      });

      return { userId: user.id, orgId: org.id };
    });

    return NextResponse.json(
      { message: "Account created successfully.", ...result },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SIGNUP_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
