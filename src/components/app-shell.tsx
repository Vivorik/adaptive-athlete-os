"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Dumbbell, LayoutDashboard, LogOut, Salad, User } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/generate", label: "Тренировки", icon: Dumbbell },
  { href: "/checkin", label: "Чек-ин", icon: Activity },
  { href: "/nutrition", label: "КБЖУ", icon: Salad },
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
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            Cheat sheet for bodybuilders
          </Link>

          <div className="flex items-center gap-1">
            {username ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/u/${username}`}>
                  <User />
                  {username}
                </Link>
              </Button>
            ) : null}

            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut />
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <nav className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-1 px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-1.5 border-b-2 px-2 py-2 text-sm transition-colors",
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
