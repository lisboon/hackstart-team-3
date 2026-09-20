import { type TrackResponse } from "@/schemas/track";

export async function fetchTrack(
  _token: string,
  _signal?: AbortSignal,
): Promise<TrackResponse> {
  // TODO: Use requestJson("/me/track") once API is ready (issue #43)
  return {
    stages: [
      { stage: "CONSCIENTIZAR", total: 6, answered: 6 },
      { stage: "OBSERVAR", total: 6, answered: 6 },
      { stage: "ORGANIZAR", total: 6, answered: 6 },
      { stage: "PREPARAR", total: 6, answered: 4 },
      { stage: "SUSTENTAR", total: 0, answered: 0 },
    ],
  };
}
