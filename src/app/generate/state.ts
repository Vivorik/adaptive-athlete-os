import type { Readiness } from "@/lib/readiness";
import type { WorkoutPlan } from "@/lib/workout-generator";

export type GenerateState = {
  plan: WorkoutPlan | null;
  readiness: Readiness | null;
  /** Дата чек-ина, по которому считалась адаптация. */
  adaptedFor: string | null;
  error: string | null;
  savedMessage: string | null;
};

export const initialGenerateState: GenerateState = {
  plan: null,
  readiness: null,
  adaptedFor: null,
  error: null,
  savedMessage: null,
};
