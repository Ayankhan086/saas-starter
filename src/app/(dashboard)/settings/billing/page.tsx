import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingActions } from "./billing-actions";
import { PLANS } from "@/lib/plans";

export const metadata = {
  title: "Billing | TeamSpace",
};

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.orgId) {
    redirect("/login");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { orgId: session.user.orgId },
  });

  const plan = subscription?.plan ?? "FREE";
  const status = subscription?.status ?? "ACTIVE";
  const limits = PLANS[plan as keyof typeof PLANS];

  // Get current usage
  const [workspaceCount, memberCount] = await Promise.all([
    prisma.workspace.count({ where: { orgId: session.user.orgId } }),
    prisma.membership.count({ where: { orgId: session.user.orgId } }),
  ]);

  const periodEnd = subscription?.currentPeriodEnd
    ? subscription.currentPeriodEnd.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing & Plan</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Manage your subscription and view your usage.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold text-white">
                {plan === "PRO" ? "Pro Plan" : "Free Plan"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : status === "PAST_DUE"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {status === "ACTIVE"
                  ? "Active"
                  : status === "PAST_DUE"
                  ? "Past Due"
                  : "Canceled"}
              </span>
            </div>
            {plan === "PRO" && periodEnd && (
              <p className="text-slate-400 text-sm">
                Next billing date: {periodEnd}
              </p>
            )}
            {plan === "FREE" && (
              <p className="text-slate-400 text-sm">
                Upgrade to Pro to unlock unlimited workspaces and members.
              </p>
            )}
          </div>

          <BillingActions
            plan={plan}
            hasStripeCustomer={!!subscription?.stripeCustomerId}
          />
        </div>
      </div>

      {/* Usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <UsageCard
          label="Workspaces"
          current={workspaceCount}
          limit={limits.maxWorkspaces}
          isPro={plan === "PRO"}
        />
        <UsageCard
          label="Team Members"
          current={memberCount}
          limit={limits.maxMembers}
          isPro={plan === "PRO"}
        />
      </div>

      {/* Plan Comparison */}
      {plan === "FREE" && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/60">
            <h3 className="text-lg font-semibold text-white">
              Compare Plans
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Feature</th>
                  <th className="px-6 py-3 font-medium text-center">Free</th>
                  <th className="px-6 py-3 font-medium text-center">
                    Pro — $29/mo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-300">
                <tr>
                  <td className="px-6 py-4">Workspaces</td>
                  <td className="px-6 py-4 text-center">
                    {PLANS.FREE.maxWorkspaces}
                  </td>
                  <td className="px-6 py-4 text-center text-indigo-400 font-medium">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Team Members</td>
                  <td className="px-6 py-4 text-center">
                    {PLANS.FREE.maxMembers}
                  </td>
                  <td className="px-6 py-4 text-center text-indigo-400 font-medium">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Tasks</td>
                  <td className="px-6 py-4 text-center">Unlimited</td>
                  <td className="px-6 py-4 text-center">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Priority Support</td>
                  <td className="px-6 py-4 text-center text-slate-500">—</td>
                  <td className="px-6 py-4 text-center text-emerald-400">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  isPro,
}: {
  label: string;
  current: number;
  limit: number;
  isPro: boolean;
}) {
  const percentage = isPro ? 0 : Math.min((current / limit) * 100, 100);
  const isAtLimit = !isPro && current >= limit;

  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="text-sm text-slate-400">
          {current} / {isPro ? "∞" : limit}
        </span>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all ${
            isAtLimit
              ? "bg-red-500"
              : percentage > 75
              ? "bg-amber-500"
              : "bg-indigo-500"
          }`}
          style={{ width: isPro ? "0%" : `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <p className="text-red-400 text-xs mt-2">
          Limit reached — upgrade to Pro for unlimited.
        </p>
      )}
    </div>
  );
}
