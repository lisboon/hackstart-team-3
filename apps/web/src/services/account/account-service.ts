import { requestJson } from "@/lib/http/client";
import { accountSchema, type Account } from "@/schemas/account";
import type { ChangePasswordValues } from "@/schemas/account";

/**
 * Quem é a pessoa da sessão. O id não vai na rota: sai do token no servidor,
 * como todo recurso pessoal.
 */
export async function fetchAccount(
  token: string,
  signal: AbortSignal,
): Promise<Account> {
  const result = await requestJson("/auth/me", {
    method: "GET",
    signal,
    headers: { authorization: `Bearer ${token}` },
  });
  const account = accountSchema.safeParse(result);
  if (!account.success)
    throw new Error("O serviço retornou um cadastro inválido.");
  return account.data;
}

/**
 * Troca a própria senha. A confirmação fica no cliente: o corpo aceito pelo
 * servidor tem exatamente dois campos, e o `ValidationPipe` roda com
 * `forbidNonWhitelisted` — mandar um terceiro devolveria 422.
 *
 * Trocar a senha chama `invalidateTokens()` no servidor, ou seja derruba a
 * sessão em todo aparelho. Quem chama precisa encerrar a sessão local em
 * seguida, senão a tela segue com um token que já morreu.
 */
export async function changePassword(
  token: string,
  values: ChangePasswordValues,
  signal: AbortSignal,
): Promise<void> {
  await requestJson("/users/me/password", {
    method: "PATCH",
    signal,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }),
  });
}
