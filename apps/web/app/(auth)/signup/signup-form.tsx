"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Mail, Lock, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  orgName: z.string().min(2, "Enter your business name"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/[0-9]/, "Include at least one number"),
});

type FormValues = z.infer<typeof schema>;

export function SignupForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await new Promise((r) => setTimeout(r, 800)); // placeholder
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          placeholder="Jane Doe"
          autoComplete="name"
          startIcon={<User />}
          error={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgName">Business name</Label>
        <Input
          id="orgName"
          placeholder="Acme Corp"
          startIcon={<Building2 />}
          error={!!errors.orgName}
          {...register("orgName")}
        />
        {errors.orgName && <p className="text-xs text-destructive">{errors.orgName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          startIcon={<Mail />}
          error={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          startIcon={<Lock />}
          error={!!errors.password}
          {...register("password")}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        Create workspace
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our{" "}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">Terms</a>
        {" "}and{" "}
        <a href="#" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</a>.
      </p>
    </form>
  );
}
