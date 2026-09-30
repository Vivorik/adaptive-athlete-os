"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatProgressReps, formatWeight, type ProgressEntry } from "@/lib/progress";
import { deleteProgressAction, setProgressVisibilityAction } from "./actions";

function ShareToggle({ entry }: { entry: ProgressEntry }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-sm">
      <Switch
        checked={entry.isPublic}
        disabled={isPending}
        aria-label={entry.isPublic ? "Скрыть из профиля" : "Показать в профиле"}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await setProgressVisibilityAction(entry.id, entry.exerciseName, checked);
          });
        }}
      />
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {entry.isPublic ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        {entry.isPublic ? "В профиле" : "Скрыто"}
      </span>
    </div>
  );
}

function DeleteButton({ entry }: { entry: ProgressEntry }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isConfirming) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Удалить запись?</span>
        <button
          type="button"
          disabled={isPending}
          className="font-medium text-destructive hover:underline disabled:opacity-50"
          onClick={() => {
            startTransition(async () => {
              await deleteProgressAction(entry.id, entry.exerciseName);
            });
          }}
        >
          {isPending ? "Удаляю…" : "Да"}
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setIsConfirming(false)}
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsConfirming(true)}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" />
      Удалить
    </button>
  );
}

export function ProgressList({ entries }: { entries: ProgressEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Мои упражнения</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Пока пусто. Заполни форму выше — прогресс появится здесь.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Мои упражнения ({entries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{entry.exerciseName}</p>
                <p className="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                  <span>
                    Рекорд: {formatProgressReps(entry.maxReps)} · {formatWeight(entry.maxWeightKg)}
                  </span>
                  <span>
                    Сейчас: {formatProgressReps(entry.workReps)} · {formatWeight(entry.workWeightKg)}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                <ShareToggle entry={entry} />
                <DeleteButton entry={entry} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
