import { requestJson } from "@/lib/http/client";
import { fetchAccount } from "@/services/account/account-service";
import type { Account } from "@/schemas/account";
import { fetchTrack } from "@/services/track/track-service";
import type { Track } from "@/schemas/track";
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
  account: Account;
  organization: CurrentOrganization;
  track: Track;
  summary: PersonalSummary;
};

/**
 * O perfil e as conquistas são derivados: nenhum dado novo é gravado. Daqui saem
 * o cadastro, a unidade, a trilha e o resumo. As quatro leituras são
 * independentes, então correm em paralelo; qualquer uma que falhe derruba a
 * tela, e o hook decide o que fazer com o erro.
 *
 * O cadastro entra na lista, e não só a sessão, porque `createdAt` e `avatarUrl`
 * existem apenas em `GET /auth/me`.
 */
export async function fetchProfile(
  token: string,
  signal: AbortSignal,
): Promise<ProfileData> {
  const [account, organization, track, summary] = await Promise.all([
    fetchAccount(token, signal),
    fetchOrganization(token, signal),
    fetchTrack(token, signal),
    fetchProfileSummary(token, signal),
  ]);
  return { account, organization, track, summary };
}
