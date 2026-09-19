# Ícones — ARTE PROVISÓRIA

**Estes três PNG são placeholders. Não são a identidade visual do produto.**

Foram gerados por script para desbloquear a issue #12 (PWA instalável), porque o
Chrome no Android só oferece a instalação quando existem ícones válidos. A arte
definitiva de "Colheita Verde" ainda será feita pelo time.

| Arquivo | Uso no manifest |
|---|---|
| `icon-192.png` | `purpose: "any"` |
| `icon-512.png` | `purpose: "any"`, também usado na splash screen |
| `maskable-512.png` | `purpose: "maskable"` |

## Ao substituir pela arte final

Trocar os arquivos mantendo os mesmos nomes e dimensões é suficiente:
`src/app/manifest.ts` não precisa de alteração.

Dois cuidados:

1. **O maskable não é o mesmo desenho do `any`.** O Android recorta o ícone em
   círculo ou squircle. O `maskable-512.png` precisa de fundo em sangria e a arte
   contida nos 80% centrais (zona segura), senão o desenho é cortado.
2. **O `background_color` e o `theme_color` do manifest** (`#07100f`) acompanham
   `--background` em `src/styles/globals.css`. Se a paleta mudar, alinhar os três.
