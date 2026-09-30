import { Gauge, Moon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import type { Readiness } from "@/lib/readiness";

const LEVEL_LABELS: Record<Readiness["level"], string> = {
  low: "Лёгкий день",
  medium: "Умеренная нагрузка",
  high: "Полная нагрузка",
};

const LEVEL_STYLES: Record<Readiness["level"], string> = {
  low: "text-amber-600 dark:text-amber-400",
  medium: "text-sky-600 dark:text-sky-400",
  high: "text-emerald-600 dark:text-emerald-400",
};

function formatFactor(factor: number) {
  const percent = Math.round((factor - 1) * 100);

  if (percent === 0) {
    return "без изменений";
  }

  return percent > 0 ? `+${percent}%` : `${percent}%`;
}

type ReadinessBannerProps = {
  readiness: Readiness;
  adaptedFor: string;
};

export function ReadinessBanner({ readiness, adaptedFor }: ReadinessBannerProps) {
  const isReduced = readiness.volumeFactor < 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {isReduced ? (
            <TrendingDown className="size-4" />
          ) : (
            <TrendingUp className="size-4" />
          )}
          Адаптация под чек-ин за {adaptedFor}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-semibold">{LEVEL_LABELS[readiness.level]}</span>
          <span className={`text-sm font-medium tabular-nums ${LEVEL_STYLES[readiness.level]}`}>
            объём {formatFactor(readiness.volumeFactor)}
          </span>
          {readiness.repFactor < 1 ? (
            <span className="text-sm text-muted-foreground tabular-nums">
              повторения {formatFactor(readiness.repFactor)}
            </span>
          ) : null}
          {readiness.soreGroups.length > 0 ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Moon className="size-3.5" />
              бережём: {readiness.soreGroups.map((group) => MUSCLE_GROUP_LABELS[group]).join(", ")}
            </span>
          ) : null}
        </div>

        {readiness.reasons.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {readiness.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-1.5">
                <Gauge className="mt-0.5 size-3 shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
