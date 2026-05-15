"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  Package,
  LayoutDashboard,
  User,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useNotificationRealtime } from "@/hooks/use-notification-realtime";
import { NotificationBell } from "./NotificationPanel";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useNotificationRealtime();

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/?search=${encodeURIComponent(search.trim())}`);
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isSeller = user?.role === "seller";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-lg text-dark hidden sm:block">
            VaultKix
          </span>
        </Link>

        {/* Search — hidden on mobile */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-xl hidden sm:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sneakers, brands..."
              className="pl-9 bg-section border-transparent focus:border-primary focus:bg-background"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
              pathname === "/"
                ? "text-primary bg-primary-light"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            Marketplace
          </Link>
          {isSeller && (
            <Link
              href="/seller"
              className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                isActive("/seller")
                  ? "text-primary bg-primary-light"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Mobile search icon */}
          <button
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center hover:bg-section transition-colors"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMobileOpen(false);
            }}
          >
            <Search className="w-5 h-5 text-dark" />
          </button>

          {isAuthenticated ? (
            <>
              <Link href="/offers" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <Package className="w-5 h-5" />
                </Button>
              </Link>

              <Link href="/orders" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="w-5 h-5" />
                </Button>
              </Link>

              <NotificationBell />
              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none">
                    <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                        {getInitials(user?.username ?? "U")}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-dark truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {isSeller && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller" className="cursor-pointer">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Sign up
                </Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setMobileOpen((v) => !v);
              setMobileSearchOpen(false);
            }}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-2">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sneakers, brands..."
                className="pl-9 bg-section border-transparent focus:border-primary"
              />
            </div>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-1">
          <Link
            href="/"
            className={`py-2.5 px-3 text-sm font-medium rounded-lg ${
              pathname === "/" ? "text-primary bg-primary-light" : "text-dark"
            }`}
            onClick={() => setMobileOpen(false)}
          >
            Marketplace
          </Link>
          {isAuthenticated && (
            <>
              <Link
                href="/offers"
                className={`py-2.5 px-3 text-sm font-medium rounded-lg ${
                  isActive("/offers")
                    ? "text-primary bg-primary-light"
                    : "text-dark"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                My Offers
              </Link>
              <Link
                href="/orders"
                className={`py-2.5 px-3 text-sm font-medium rounded-lg ${
                  isActive("/orders")
                    ? "text-primary bg-primary-light"
                    : "text-dark"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
              <Link
                href="/notifications"
                className={`py-2.5 px-3 text-sm font-medium rounded-lg ${
                  isActive("/notifications")
                    ? "text-primary bg-primary-light"
                    : "text-dark"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                Notifications
              </Link>
              {isSeller && (
                <Link
                  href="/seller"
                  className={`py-2.5 px-3 text-sm font-medium rounded-lg ${
                    isActive("/seller")
                      ? "text-primary bg-primary-light"
                      : "text-dark"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  Seller Dashboard
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
}
