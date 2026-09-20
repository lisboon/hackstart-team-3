import {
  CARE_DISCLAIMER,
  CRISIS_LINE,
  SUPPORT_PATHS,
} from "./mood-presentation";

/**
 * Os caminhos de apoio, em um lugar só. O acolhimento do humor de sofrimento e
 * a aba sempre alcançável mostram a mesma lista: duas cópias divergiriam, e a
 * que ficasse para trás seria justamente a que alguém leria num dia ruim.
 *
 * O CVV fica destacado porque é o único validado por definição — serviço
 * público, gratuito, 24h. Os outros cinco seguem pendentes de validação (#17) e
 * por isso descrevem possibilidade, não garantia.
 */
export function SupportChannels() {
  return (
    <>
      <p className="text-sm">
        Se quiser falar com alguém, a escolha é sua — inclusive a de não falar. O
        app não avisa ninguém.
      </p>
      <ul className="grid gap-2">
        {SUPPORT_PATHS.map((path) => (
          <li
            key={path.title}
            className="grid min-w-0 gap-1 rounded-xl border border-border p-3"
          >
            <span className="text-sm font-semibold">{path.title}</span>
            <span className="text-sm text-muted-foreground">{path.detail}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-1 rounded-xl border border-border bg-muted p-3">
        <a
          href={CRISIS_LINE.href}
          className="rounded-lg py-1 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {CRISIS_LINE.label}
        </a>
        <span className="text-sm text-muted-foreground">
          {CRISIS_LINE.detail}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{CARE_DISCLAIMER}</p>
    </>
  );
}
