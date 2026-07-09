"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, LockKeyhole, User2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginFormValues } from "@/validation/auth";

export default function LoginPage() {
  const router = useRouter();
  const [visiblePassword, setVisiblePassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const response = await signIn("credentials", {
      username: values.username,
      password: values.password,
      redirect: false,
      callbackUrl: "/",
    });

    if (response?.error) {
      toast.error("Invalid credentials or inactive account.");
      return;
    }

    toast.success("Login successful.");
    router.push("/");
    router.refresh();
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_30px_100px_rgba(148,163,184,0.16)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[linear-gradient(135deg,_#0f172a_0%,_#1f2937_55%,_#ea580c_120%)] p-8 text-white md:p-10 lg:p-12">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">
            Secure restaurant access
          </div>
          <h1 className="mt-6 max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight md:text-5xl">
            Sign in to the restaurant operating system.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200 md:text-base">
            Use your assigned username and password to access cashier, waiter,
            kitchen, inventory, accounting, and super admin workflows.
          </p>

          <div className="mt-10 grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-slate-300">Authentication</div>
              <div className="mt-1 text-lg font-semibold text-white">
                JWT sessions
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-slate-300">Role control</div>
              <div className="mt-1 text-lg font-semibold text-white">
                Permission aware
              </div>
            </div>
          </div>
        </div>

        <form
          className="flex flex-col justify-center gap-6 p-8 md:p-10 lg:p-12"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-slate-950">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Log in to continue to the POS dashboard.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Username
            </label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-11"
                placeholder="Enter username"
                {...register("username")}
              />
            </div>
            {errors.username ? (
              <p className="text-sm text-rose-600">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-11 pr-12"
                type={visiblePassword ? "text" : "password"}
                placeholder="Enter password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setVisiblePassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
              >
                {visiblePassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-sm text-rose-600">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                {...register("rememberMe")}
              />
              Remember me
            </label>
            <Link
              className="font-medium text-orange-600 hover:text-orange-700"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          <Button disabled={isSubmitting} className="h-12 text-base">
            {isSubmitting ? "Signing in..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </section>
    </main>
  );
}
