"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, LayoutDashboard, LogOut, Salad, TrendingUp, User } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/generate", label: "Тренировки", icon: Dumbbell },
  { href: "/checkin", label: "Чек-ин", icon: Activity },
  { href: "/nutrition", label: "КБЖУ", icon: Salad },
  { href: "/progress", label: "Прогресс", icon: TrendingUp },
] as const;

type AppShellProps = {
  username: string | null;
  children: ReactNode;
};

export function AppShell({ username, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="min-w-0 truncate text-sm font-semibold tracking-tight"
          >
            Cheat sheet for bodybuilders
          </Link>

          <div className="flex shrink-0 items-center gap-1">
            {username ? (
              <Button variant="ghost" size="sm" asChild className="min-w-0 px-2 sm:px-3">
                <Link href={`/u/${username}`}>
                  <User />
                  <span className="max-w-24 truncate sm:max-w-none">{username}</span>
                </Link>
              </Button>
            ) : null}

            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="px-2 sm:px-3">
                <LogOut />
                <span className="hidden sm:inline">Выйти</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        {/* Пять вкладок не помещаются в 360px, поэтому ряд прокручивается по горизонтали. */}
        <div className="mx-auto flex w-full max-w-3xl items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-2.5 text-sm transition-colors sm:px-3",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
