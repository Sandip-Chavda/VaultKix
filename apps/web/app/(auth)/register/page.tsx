"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { UserRole } from "@vaultkix/types";

// const ROLES: { value: UserRole; label: string; description: string }[] = [
//   {
//     value: "buyer",
//     label: "Buyer",
//     description: "Browse and buy sneakers",
//   },
//   {
//     value: "seller",
//     label: "Seller",
//     description: "List and sell your sneakers",
//   },
//   {
//     value: "both",
//     label: "Both",
//     description: "Buy and sell on the platform",
//   },
// ];

const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: "buyer",
    label: "Buyer",
    description: "Browse and buy sneakers",
  },
  {
    value: "seller",
    label: "Seller",
    description: "List and sell your sneakers",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    role: "buyer" as UserRole,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      router.push("/");
    } catch {
      // error is already set in store
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-border">
      <CardHeader className="space-y-2 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-lg text-dark">VaultKix</span>
        </div>
        <h1 className="text-2xl font-bold text-dark">Create account</h1>
        <p className="text-muted-foreground text-sm">
          Join VaultKix and start trading sneakers
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-destructive/30 text-destructive text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="sneakerhead42"
              value={form.username}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Role selector */}
          <div className="space-y-1.5">
            <Label>I want to</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => {
                    clearError();
                    setForm((prev) => ({ ...prev, role: role.value }));
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    form.role === role.value
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold text-sm">{role.label}</p>
                  <p className="text-xs mt-0.5 leading-tight">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
