"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Save, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupExercisesByMuscle } from "@/lib/labels";
import { PROGRESS_LIMITS } from "@/lib/progress";
import { saveProgressAction } from "./actions";
import { initialProgressState } from "./state";

const EXERCISE_GROUPS = groupExercisesByMuscle();

export function ProgressForm() {
  const [state, formAction, isPending] = useActionState(saveProgressAction, initialProgressState);
  const [exerciseName, setExerciseName] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Записать упражнение</CardTitle>
        <CardDescription className="text-xs">
          Личный рекорд и то, с чем ты работаешь сейчас. Запись по упражнению одна, повторно
          обновляет ту же строку. Если отягощения нет — поставь 0.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exerciseName">Упражнение</Label>
            <Select value={exerciseName} onValueChange={setExerciseName} name="exerciseName">
              <SelectTrigger id="exerciseName" className="w-full">
                <SelectValue placeholder="Выбери упражнение" />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_GROUPS.map((group) => (
                  <SelectGroup key={group.group}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.exercises.map((exercise) => (
                      <SelectItem key={exercise.name} value={exercise.name}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Личный рекорд</legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxReps">Повторений</Label>
                <Input
                  id="maxReps"
                  name="maxReps"
                  type="number"
                  inputMode="numeric"
                  min={PROGRESS_LIMITS.reps.min}
                  max={PROGRESS_LIMITS.reps.max}
                  step={1}
                  required
                  defaultValue={8}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maxWeight">Вес, кг</Label>
                <Input
                  id="maxWeight"
                  name="maxWeight"
                  type="number"
                  inputMode="decimal"
                  min={PROGRESS_LIMITS.weightKg.min}
                  max={PROGRESS_LIMITS.weightKg.max}
                  step="0.5"
                  required
                  defaultValue={40}
                />
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Рабочее сейчас</legend>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workReps">Повторений</Label>
                <Input
                  id="workReps"
                  name="workReps"
                  type="number"
                  inputMode="numeric"
                  min={PROGRESS_LIMITS.reps.min}
                  max={PROGRESS_LIMITS.reps.max}
                  step={1}
                  required
                  defaultValue={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="workWeight">Вес, кг</Label>
                <Input
                  id="workWeight"
                  name="workWeight"
                  type="number"
                  inputMode="decimal"
                  min={PROGRESS_LIMITS.weightKg.min}
                  max={PROGRESS_LIMITS.weightKg.max}
                  step="0.5"
                  required
                  defaultValue={20}
                />
              </div>
            </fieldset>
          </div>

          <Button type="submit" disabled={isPending || !exerciseName}>
            <Save />
            Сохранить
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
      </CardContent>
    </Card>
  );
}
