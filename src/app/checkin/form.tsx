"use client";

import { useActionState, useState } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { MUSCLE_GROUP_LABELS } from "@/lib/labels";
import { useLocalToday } from "@/lib/use-local-today";
import { saveCheckinAction } from "./actions";
import { initialCheckinState } from "./state";

const MUSCLE_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as (keyof typeof MUSCLE_GROUP_LABELS)[];

const INITIAL_SORENESS: Record<string, number> = Object.fromEntries(
  MUSCLE_GROUPS.map((group) => [group, 0]),
);

export function CheckinForm() {
  const [state, formAction, isPending] = useActionState(saveCheckinAction, initialCheckinState);
  const { today, ready } = useLocalToday();
  const [sleepHours, setSleepHours] = useState(7);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState<Record<string, number>>(INITIAL_SORENESS);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="date" value={today ?? ""} />
      <input type="hidden" name="soreness" value={JSON.stringify(soreness)} />
      <input type="hidden" name="sleepHours" value={sleepHours} />
      <input type="hidden" name="energy" value={energy} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Сон</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 sm:gap-4">
          <Slider
            min={0}
            max={12}
            step={0.5}
            value={[sleepHours]}
            onValueChange={(value) => setSleepHours(value[0] ?? 0)}
            aria-label="Часов сна"
            className="min-w-0 flex-1"
          />
          <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums sm:w-24">
            {sleepHours.toFixed(1).replace(".", ",")} ч
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Энергия</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 sm:gap-4">
          <Slider
            min={1}
            max={5}
            step={1}
            value={[energy]}
            onValueChange={(value) => setEnergy(value[0] ?? 3)}
            aria-label="Энергия от 1 до 5"
            className="min-w-0 flex-1"
          />
          <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums sm:w-24">
            {energy} / 5
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Крепатура мышц
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {MUSCLE_GROUPS.map((group) => (
            <div key={group} className="flex items-center gap-3 sm:gap-4">
              <Label
                htmlFor={`soreness-${group}`}
                className="w-20 shrink-0 text-sm sm:w-24"
              >
                {MUSCLE_GROUP_LABELS[group]}
              </Label>
              <Slider
                id={`soreness-${group}`}
                min={0}
                max={5}
                step={1}
                value={[soreness[group] ?? 0]}
                onValueChange={(value) =>
                  setSoreness((previous) => ({ ...previous, [group]: value[0] ?? 0 }))
                }
                className="min-w-0 flex-1"
              />
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground sm:w-12">
                {soreness[group] ?? 0}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Заметка</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" rows={3} maxLength={500} placeholder="Например: болела спина, плохо спал" />
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending || !ready} className="self-start">
        {!ready ? "Определяю дату…" : isPending ? "Сохраняю…" : "Сохранить чек-ин"}
      </Button>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      {state.savedMessage ? (
        <p className="flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          <CircleCheck className="mt-0.5 size-4 shrink-0" />
          {state.savedMessage}
        </p>
      ) : null}
    </form>
  );
}
