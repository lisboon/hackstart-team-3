import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Retrato da pessoa, com as iniciais como estado normal e não como falha: a
 * maioria dos cadastros da demonstração não tem `avatarUrl`, e um contorno
 * cinza com silhueta genérica faria o perfil parecer incompleto justamente na
 * tela que deveria dizer "isto é seu".
 *
 * As iniciais vêm prontas (ver `initials` em `profile-presentation.ts`): quebrar
 * nome é regra de texto, testável sem React, e não pertence a uma primitiva.
 *
 * O bloco é `aria-hidden` porque quem usa sempre desenha o nome ao lado; um
 * leitor de tela anunciando "AF" antes de "Ana Ferreira" só atrasa a leitura.
 */
export function Avatar({
  initials,
  src,
  className,
  ...props
}: {
  initials: string;
  src?: string;
} & Omit<ComponentProps<"span">, "children">) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-muted text-lg font-semibold text-primary",
        className,
      )}
      {...props}
    >
      {src ? (
        /* O endereço vem do cadastro e pode ser de qualquer domínio.
           `next/image` exigiria uma lista de domínios permitidos para um campo
           que a demonstração não controla, e a foto tem 56px: não há LCP a
           salvar aqui. */
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
