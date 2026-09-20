"use client";

import { Button } from "@/components/ui/button";

/**
 * Confirmação de saída. Duas razões para ela existir:
 *
 * A sessão vive no `sessionStorage`, então sair significa digitar e-mail e senha
 * de novo — num celular, em pé, no intervalo. E o produto é diário: quem sai sem
 * querer perde a sequência do dia.
 *
 * O botão que confirma é o de destaque e o de cancelar vem primeiro, na ordem de
 * leitura, para que o caminho fácil seja o de voltar.
 */
export function SignOutDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="grid gap-4">
      <p className="text-sm">
        Você vai precisar entrar de novo com e-mail e senha neste aparelho. A sua
        história e as suas conquistas continuam guardadas.
      </p>
      <div className="grid gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Continuar no app
        </Button>
        <Button type="button" onClick={onConfirm}>
          Sair mesmo assim
        </Button>
      </div>
    </div>
  );
}
