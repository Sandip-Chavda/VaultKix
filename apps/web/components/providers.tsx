"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";

export function Providers({ children }: { children: React.ReactNode }) {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
