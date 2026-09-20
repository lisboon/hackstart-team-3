import { requestJson } from "@/lib/http/client";
import { trackResponseSchema, type TrackResponse } from "@/schemas/track";

/**
 * O progresso é de quem pede: a rota sai da sessão e não recebe usuário por
 * parâmetro, como todo recurso pessoal.
 */
export async function fetchTrack(
  token: string,
  signal: AbortSignal,
): Promise<TrackResponse> {
  const result = await requestJson("/me/track", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const track = trackResponseSchema.safeParse(result);
  if (!track.success) throw new Error("O serviço retornou uma trilha inválida.");
  return track.data;
}
