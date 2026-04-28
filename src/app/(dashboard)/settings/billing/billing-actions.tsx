"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

interface BillingActionsProps {
  plan: string;
  hasStripeCustomer: boolean;
}

export function BillingActions({ plan, hasStripeCustomer }: BillingActionsProps) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(data.error || "Failed to open billing portal");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      {success && (
        <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          🎉 Upgrade successful! Welcome to Pro.
        </div>
      )}
      {canceled && (
        <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          Checkout was canceled. No changes made.
        </div>
      )}

      {plan === "FREE" ? (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "Redirecting..." : "Upgrade to Pro — $29/mo"}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {hasStripeCustomer && (
            <button
              onClick={handleManage}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
