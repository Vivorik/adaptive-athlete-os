"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateStreak } from "@/lib/streak";
import { useLocalToday } from "@/lib/use-local-today";

type DailyStatusProps = {
  checkinDates: string[];
};

export function DailyStatus({ checkinDates }: DailyStatusProps) {
  const { today } = useLocalToday();

  if (!today) {
    return (
      <div className="grid gap-4 sm:grid-cols-3" aria-hidden="true">
        <Card className="h-[104px]" />
        <Card className="h-[104px]" />
        <Card className="h-[104px]" />
      </div>
    );
  }

  const streak = calculateStreak(checkinDates, today);
  const checkedInToday = checkinDates.includes(today);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="size-4" />
            Серия чек-инов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tabular-nums">{streak}</p>
          <p className="text-xs text-muted-foreground">
            {streak === 0 ? "Начни серию сегодня" : "дней подряд"}
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {checkedInToday ? "Чек-ин за сегодня уже есть" : "Чек-ин за сегодня не сделан"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/checkin">{checkedInToday ? "Изменить чек-ин" : "Сделать чек-ин"}</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
