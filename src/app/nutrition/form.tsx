"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  calculateMacros,
  GOAL_LABELS,
  INPUT_LIMITS,
  NUTRITION_GOALS,
  SEXES,
  type ActivityLevel,
  type MacroResult,
  type NutritionGoal,
  type Sex,
} from "@/lib/nutrition";

const SEX_LABELS: Record<Sex, string> = {
  male: "Мужской",
  female: "Женский",
};

export function NutritionForm() {
  const [sex, setSex] = useState<Sex>("male");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<NutritionGoal>("cut");
  const [result, setResult] = useState<MacroResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        try {
          setResult(
            calculateMacros({
              weightKg: Number(formData.get("weightKg")),
              heightCm: Number(formData.get("heightCm")),
              age: Number(formData.get("age")),
              sex,
              activityLevel,
              goal,
            }),
          );
          setError(null);
        } catch (cause) {
          setResult(null);
          setError(cause instanceof RangeError ? cause.message : "Не удалось рассчитать КБЖУ.");
        }
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Данные</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="weightKg">Вес, кг</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              min={INPUT_LIMITS.weightKg.min}
              max={INPUT_LIMITS.weightKg.max}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="heightCm">Рост, см</Label>
            <Input
              id="heightCm"
              name="heightCm"
              type="number"
              min={INPUT_LIMITS.heightCm.min}
              max={INPUT_LIMITS.heightCm.max}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="age">Возраст</Label>
            <Input
              id="age"
              name="age"
              type="number"
              min={INPUT_LIMITS.age.min}
              max={INPUT_LIMITS.age.max}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sex">Пол</Label>
            <Select value={sex} onValueChange={(value) => setSex(value as Sex)}>
              <SelectTrigger id="sex" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEXES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {SEX_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="activityLevel">Активность</Label>
            <Select
              value={activityLevel}
              onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
            >
              <SelectTrigger id="activityLevel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ACTIVITY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="goal">Цель</Label>
            <Select value={goal} onValueChange={(value) => setGoal(value as NutritionGoal)}>
              <SelectTrigger id="goal" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUTRITION_GOALS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {GOAL_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="self-start">
        Рассчитать КБЖУ
      </Button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Твой результат
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Калории</p>
                <p className="text-2xl font-semibold tabular-nums">{result.calories}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Белки</p>
                <p className="text-2xl font-semibold tabular-nums">{result.proteinG} г</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Жиры</p>
                <p className="text-2xl font-semibold tabular-nums">{result.fatG} г</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Углеводы</p>
                <p className="text-2xl font-semibold tabular-nums">{result.carbsG} г</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Базовый обмен {result.bmr} ккал, суточная потребность {result.tdee} ккал, белок{" "}
              {result.proteinPerKg} г/кг, жиры {result.fatShareOfCalories}% калорий.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
