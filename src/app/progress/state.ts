export type ProgressState = {
  error: string | null;
  savedMessage: string | null;
  savedExerciseName: string | null;
};

export const initialProgressState: ProgressState = {
  error: null,
  savedMessage: null,
  savedExerciseName: null,
};
