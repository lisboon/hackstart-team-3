import { z } from "zod";

/**
 * Contrato de `GET /auth/me`. É a única rota que devolve `createdAt` e
 * `avatarUrl` — o corpo do login traz apenas id, nome, e-mail e papel —, e são
 * eles que permitem o perfil dizer desde quando a pessoa está ali sem inventar
 * a data.
 *
 * `deletedAt` existe na resposta e não é lido: um cadastro apagado não chega
 * até aqui, porque o próprio `AuthGuard` recusa a sessão antes.
 */
export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER", "USER"]),
  companyId: z.string(),
  avatarUrl: z.string().optional(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Account = z.infer<typeof accountSchema>;

/**
 * Contrato de `PATCH /users/me/password`. O mínimo de oito é o do servidor
 * (`ChangePasswordBodyDto`); repetir aqui evita uma ida à rede para receber 422.
 *
 * A confirmação não vai no corpo: existe só para a pessoa não trocar a senha
 * por um erro de digitação que ela não teria como descobrir depois.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha precisa de pelo menos 8 caracteres.")
      .max(128, "A nova senha passa de 128 caracteres."),
    confirmation: z.string().min(1, "Repita a nova senha."),
  })
  .refine((values) => values.newPassword === values.confirmation, {
    path: ["confirmation"],
    error: "As duas senhas não são iguais.",
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
