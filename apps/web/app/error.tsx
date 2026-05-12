"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-section flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-destructive text-2xl font-bold">!</span>
        </div>

        <h2 className="text-xl font-bold text-dark mb-2">
          Something went wrong
        </h2>
        <p className="text-muted-foreground text-sm mb-2">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono bg-section rounded px-2 py-1 inline-block mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center mt-6">
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={reset}
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
