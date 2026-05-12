import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-section flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">V</span>
        </div>

        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl font-bold text-dark mb-2">Page not found</h2>
        <p className="text-muted-foreground text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Back to Marketplace
            </Button>
          </Link>
          <Link href="/offers">
            <Button variant="outline">My Offers</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
