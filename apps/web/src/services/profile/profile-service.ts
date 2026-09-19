import { requestJson } from "@/lib/http/client";
import { trackSchema, type Track } from "@/schemas/profile";
import {
  currentOrganizationSchema,
  type CurrentOrganization,
} from "@/schemas/organization";
import {
  personalSummarySchema,
  type PersonalSummary,
} from "@/schemas/financial-health";

function authorized(token: string, signal: AbortSignal): RequestInit {
  return { method: "GET", signal, headers: { authorization: `Bearer ${token}` } };
}

export async function fetchTrack(
  token: string,
  signal: AbortSignal,
): Promise<Track> {
  const result = await requestJson("/me/track", authorized(token, signal));
  const track = trackSchema.safeParse(result);
  if (!track.success) throw new Error("O serviço retornou uma trilha inválida.");
  return track.data;
}

export async function fetchOrganization(
  token: string,
  signal: AbortSignal,
): Promise<CurrentOrganization> {
  const result = await requestJson(
    "/organizations/current",
    authorized(token, signal),
  );
  const organization = currentOrganizationSchema.safeParse(result);
  if (!organization.success)
    throw new Error("O serviço retornou uma organização inválida.");
  return organization.data;
}

export async function fetchProfileSummary(
  token: string,
  signal: AbortSignal,
): Promise<PersonalSummary> {
  const result = await requestJson("/me/summary", authorized(token, signal));
  const summary = personalSummarySchema.safeParse(result);
  if (!summary.success) throw new Error("O serviço retornou um resumo inválido.");
  return summary.data;
}

export type ProfileData = {
  organization: CurrentOrganization;
  track: Track;
  summary: PersonalSummary;
};

/**
 * O perfil e as conquistas são derivados: nenhum dado novo é gravado. O nome da
 * pessoa vem da sessão (`useAuth`); daqui saem a unidade, a trilha e o resumo.
 * As três leituras são independentes, então correm em paralelo; qualquer uma
 * que falhe derruba a tela, e o hook decide o que fazer com o erro.
 */
export async function fetchProfile(
  token: string,
  signal: AbortSignal,
): Promise<ProfileData> {
  const [organization, track, summary] = await Promise.all([
    fetchOrganization(token, signal),
    fetchTrack(token, signal),
    fetchProfileSummary(token, signal),
  ]);
  return { organization, track, summary };
}
