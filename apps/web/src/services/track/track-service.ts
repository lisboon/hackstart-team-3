import { requestJson } from "@/lib/http/client";
import { trackSchema, type Track } from "@/schemas/track";

/**
 * O progresso é de quem pede: a rota sai da sessão e não recebe usuário por
 * parâmetro, como todo recurso pessoal.
 *
 * É a única leitura de `/me/track` do app. A tela da trilha e o perfil chamam
 * esta função; havia uma segunda cópia em `services/profile`, e duas cópias da
 * mesma leitura divergem na primeira mudança de contrato.
 */
export async function fetchTrack(
  token: string,
  signal: AbortSignal,
): Promise<Track> {
  const result = await requestJson("/me/track", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const track = trackSchema.safeParse(result);
  if (!track.success) throw new Error("O serviço retornou uma trilha inválida.");
  return track.data;
}
