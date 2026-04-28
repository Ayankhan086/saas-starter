import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { OrgSettingsForm } from "./org-settings-form";

export const metadata = {
  title: "Settings | TeamSpace",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    select: { id: true, name: true, slug: true },
  });

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage your organization&apos;s profile and preferences.
        </p>
      </div>

      <OrgSettingsForm
        orgId={org.id}
        initialName={org.name}
        slug={org.slug}
        isOwner={session.user.role === "OWNER"}
      />
    </div>
  );
}
