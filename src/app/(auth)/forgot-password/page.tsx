"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/validation/auth";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async () => {
    toast.success("Password reset instructions have been queued for delivery.");
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <section className="w-full max-w-lg rounded-[32px] border border-orange-100 bg-white p-8 shadow-[0_30px_100px_rgba(148,163,184,0.16)] md:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold text-slate-950">
          Forgot password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter the email address tied to your account and we will send a reset
          link.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="relative">
              <MailCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-11"
                placeholder="name@restaurant.com"
                {...register("email")}
              />
            </div>
            {errors.email ? (
              <p className="text-sm text-rose-600">{errors.email.message}</p>
            ) : null}
          </div>

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        <Link
          className="mt-6 inline-flex text-sm font-medium text-orange-600 hover:text-orange-700"
          href="/login"
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
