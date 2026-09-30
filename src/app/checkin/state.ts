export type CheckinState = {
  error: string | null;
  savedMessage: string | null;
};

export const initialCheckinState: CheckinState = {
  error: null,
  savedMessage: null,
};
