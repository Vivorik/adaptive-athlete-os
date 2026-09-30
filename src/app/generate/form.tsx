"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Save, TriangleAlert } from "lucide-react";
import { ReadinessBanner } from "@/components/readiness-banner";
import { WorkoutPlanView } from "@/components/workout-plan-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EQUIPMENT_MODE_LABELS,
  EXPERIENCE_LABELS,
  WORKOUT_GOAL_DESCRIPTIONS,
  WORKOUT_GOAL_LABELS,
} from "@/lib/labels";
import { useLocalToday } from "@/lib/use-local-today";
import { GOALS, EXPERIENCE_LEVELS, EQUIPMENT_MODES, DAYS_PER_WEEK_RANGE, type EquipmentMode, type Experience, type Goal } from "@/lib/workout-generator";
import { generateAction } from "./actions";
import { initialGenerateState } from "./state";

const DAY_OPTIONS = Array.from(
  { length: DAYS_PER_WEEK_RANGE.max - DAYS_PER_WEEK_RANGE.min + 1 },
  (_, index) => DAYS_PER_WEEK_RANGE.min + index,
);

export function GenerateForm() {
  const [state, formAction, isPending] = useActionState(generateAction, initialGenerateState);
  const { today, ready } = useLocalToday();
  const [goal, setGoal] = useState<Goal>("hypertrophy");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState<EquipmentMode>("gym");
  const [experience, setExperience] = useState<Experience>("beginner");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Параметры</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="goal" value={goal} />
            <input type="hidden" name="daysPerWeek" value={daysPerWeek} />
            <input type="hidden" name="equipment" value={equipment} />
            <input type="hidden" name="experience" value={experience} />
            <input type="hidden" name="date" value={today ?? ""} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal">Цель</Label>
              <Select value={goal} onValueChange={(value) => setGoal(value as Goal)}>
                <SelectTrigger id="goal" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {WORKOUT_GOAL_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{WORKOUT_GOAL_DESCRIPTIONS[goal]}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="daysPerWeek">Дней в неделю</Label>
                <Select
                  value={String(daysPerWeek)}
                  onValueChange={(value) => setDaysPerWeek(Number(value))}
                >
                  <SelectTrigger id="daysPerWeek" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OPTIONS.map((days) => (
                      <SelectItem key={days} value={String(days)}>
                        {days}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="equipment">Инвентарь</Label>
                <Select value={equipment} onValueChange={(value) => setEquipment(value as EquipmentMode)}>
                  <SelectTrigger id="equipment" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {EQUIPMENT_MODE_LABELS[mode]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="experience">Опыт</Label>
                <Select
                  value={experience}
                  onValueChange={(value) => setExperience(value as Experience)}
                >
                  <SelectTrigger id="experience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {EXPERIENCE_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" name="intent" value="generate" disabled={isPending || !ready}>
                Сгенерировать
              </Button>
              {state.plan ? (
                <Button
                  type="submit"
                  name="intent"
                  value="save"
                  variant="outline"
                  disabled={isPending || !ready}
                >
                  <Save />
                  Сохранить
                </Button>
              ) : null}
            </div>
          </form>

          {state.error ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          {state.savedMessage ? (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
              {state.savedMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {state.plan ? (
        <>
          {state.readiness && state.adaptedFor ? (
            <ReadinessBanner readiness={state.readiness} adaptedFor={state.adaptedFor} />
          ) : null}

          <WorkoutPlanView plan={state.plan} />
        </>
      ) : null}
    </div>
  );
}
