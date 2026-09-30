"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  MUSCLE_GROUP_LABELS,
  WORKOUT_GOAL_LABELS,
} from "@/lib/labels";
import type { WorkoutPlan } from "@/lib/workout-generator";

export function WorkoutPlanView({ plan }: { plan: WorkoutPlan }) {
  return (
    <div className="flex flex-col gap-3">
      {plan.days.map((day) => (
        <Card key={day.dayNumber}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              День {day.dayNumber} — {day.focus.map((group) => MUSCLE_GROUP_LABELS[group]).join(" + ")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {day.exercises.map((exercise) => (
                <li
                  key={exercise.name}
                  className="flex items-center justify-between gap-4 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{exercise.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {MUSCLE_GROUP_LABELS[exercise.muscleGroup]} · {EQUIPMENT_LABELS[exercise.equipment]} ·{" "}
                      {DIFFICULTY_LABELS[exercise.difficulty]}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-semibold tabular-nums">
                      {exercise.sets}×{exercise.reps}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      отдых {exercise.restSeconds}с
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground">
        Программа собрана под цель «{WORKOUT_GOAL_LABELS[plan.goal].toLowerCase()}» и рассчитана на{" "}
        {plan.daysPerWeek} {plan.daysPerWeek === 1 ? "тренировку" : "тренировки"} в неделю.
      </p>
    </div>
  );
}
