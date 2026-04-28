"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleDemoLogin() {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email: "demo@teamspace.dev",
      password: "Demo1234!",
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Demo account not set up yet. Please sign up first.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to your account</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs text-slate-500 bg-slate-800/60 px-2">
          or
        </div>
      </div>

      <button
        id="demo-login"
        onClick={handleDemoLogin}
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
      >
        🚀 Try Demo Account
      </button>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
