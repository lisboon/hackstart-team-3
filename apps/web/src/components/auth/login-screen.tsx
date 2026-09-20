import { ColheitaMark } from "@/components/brand/colheita-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LoginForm } from "./login-form";
import type { LoginValues } from "@/schemas/auth";

/**
 * A entrada cobre a janela inteira, venha de onde vier: o `AuthGate` monta ela
 * de dentro da moldura de celular, e `fixed` é o que a tira de lá sem obrigar
 * cada página a saber disso. No desktop vira duas colunas, com a marca d'água
 * à esquerda e um painel de vidro à direita.
 *
 * A referência renderiza duas árvores, uma escondida por `md:hidden` e outra
 * por `hidden md:flex`. Aqui é uma só, mudando de coluna para duas linhas por
 * CSS: duas cópias significariam dois campos de e-mail com o mesmo rótulo e o
 * mesmo `id`, e um leitor de tela leria o formulário duas vezes.
 */
export function LoginScreen({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (values: LoginValues) => Promise<void>;
  pending: boolean;
  error: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-background">
      {/* Metade esquerda: só a marca d'água, sangrando para fora. */}
      <div aria-hidden className="relative hidden w-1/2 md:block">
        <ColheitaMark className="absolute -bottom-[40vh] -left-[4vw] h-full w-full scale-[1.7] text-brand opacity-[0.07]" />
      </div>

      <div className="relative flex w-full flex-col items-center justify-center px-6 md:w-1/2">
        {/* O brilho vem antes do vidro para ser desfocado por ele. Um quarto
            de círculo preso no canto, com a sombra fazendo o trabalho. */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 z-0 blur-xl"
        >
          <div className="size-[400px] rounded-full rounded-r-none rounded-t-none bg-brand opacity-30 shadow-[-50px_50px_500px_50px_var(--brand)]" />
        </div>

        <ColheitaMark
          aria-hidden
          className="pointer-events-none absolute -bottom-[36vh] -left-[20vw] z-0 h-full w-full scale-[1.2] text-brand opacity-[0.07] md:hidden"
        />

        {/* A separação é este painel, não um cartão: o vidro cobre a coluna
            inteira e é o que divide a marca do formulário. */}
        <div
          aria-hidden
          className="absolute inset-0 z-10 bg-background/30 backdrop-blur-md"
        />

        <ThemeToggle className="absolute right-5 top-5 z-30" />

        <div className="relative z-20 w-full max-w-[400px]">
          <header className="mb-10">
            <div className="flex items-center gap-3">
              <ColheitaMark className="size-11 text-brand" />
              <span className="text-3xl font-semibold tracking-tight">
                Colheita
              </span>
            </div>
            <h1 className="mt-10 flex flex-col text-lg font-normal uppercase leading-none">
              <span>Cinco minutos por dia</span>
              <span>
                para{" "}
                <span className="font-bold text-primary">
                  cuidar do seu dinheiro
                </span>
              </span>
            </h1>
          </header>
          <LoginForm onSubmit={onSubmit} pending={pending} error={error} />
        </div>
      </div>
    </div>
  );
}
