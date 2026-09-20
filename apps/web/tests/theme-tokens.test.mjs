import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

/**
 * Cor literal não sobrevive ao tema escuro.
 *
 * A trilha aprendeu isso do jeito caro: estava pintada com `emerald-600`,
 * `slate-200` e `#4ade80`, e num aparelho em tema escuro virava um retângulo
 * branco luminoso sobre uma página quase preta. Os tokens de `globals.css`
 * existem para isso, e `contrast.test.mjs` só consegue guardar o que passa por
 * eles.
 *
 * Este teste é o par daquele: ele garante que a tela realmente use os tokens,
 * em vez de furar a paleta com uma cor da tabela do Tailwind.
 */

/**
 * O que ainda não foi convertido. A lista só pode encolher — quem tokenizar um
 * arquivo tira o nome daqui, e quem quiser acrescentar um nome precisa
 * explicar por quê num PR.
 */
const AINDA_NAO_CONVERTIDOS = new Set([
  // Os chips de dia protegido e de hoje usam `sky-*` e `amber-*`. Convertê-los
  // exige decidir um par de tokens para "protegido" e "hoje" que passe em
  // contraste nos dois temas, e isso é escolha de identidade, não faxina.
  "src/components/streak/weekly-harvest-card.tsx",
]);

const PALETA_TAILWIND =
  /\b(?:bg|text|border|ring|stroke|fill|from|to|via|outline|decoration|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

/**
 * Cor crua dentro de valor arbitrário do Tailwind — `bg-[#4ade80]`,
 * `shadow-[0_6px_0_#15803d]`. É por aí que a cor literal entra sem passar pela
 * tabela da paleta, e foi exatamente assim que o relevo dos nós da trilha
 * ficou preso ao tema claro.
 *
 * Hex fora de classe continua permitido: `themeColor` do `layout.tsx` e as
 * cores do `manifest.ts` são metadados do navegador, não pintura de tela, e
 * ali o valor literal é o certo.
 */
const HEX_EM_CLASSE = /-\[[^\]]*#[0-9a-fA-F]{3,8}/;

function arquivosDeInterface(dir, encontrados = []) {
  for (const entrada of readdirSync(dir)) {
    const caminho = join(dir, entrada);
    if (statSync(caminho).isDirectory()) {
      arquivosDeInterface(caminho, encontrados);
    } else if (/\.tsx?$/.test(entrada)) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

/** Comentário não pinta nada, e explicar a cor antiga é justamente o que se quer. */
function semComentarios(linha) {
  return linha.replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
}

test("a interface pinta com token, não com cor literal", () => {
  // `fileURLToPath`, e não `URL.pathname`: o caminho deste repositório tem
  // espaço no nome, e `pathname` o entrega percent-encoded.
  const app = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
  const infratores = [];

  for (const caminho of arquivosDeInterface(join(app, "src"))) {
    const relativo = relative(app, caminho).replace(/\\/g, "/");
    if (AINDA_NAO_CONVERTIDOS.has(relativo)) continue;

    readFileSync(caminho, "utf8")
      .split("\n")
      .forEach((linha, i) => {
        const codigo = semComentarios(linha);
        const achado = PALETA_TAILWIND.exec(codigo) ?? HEX_EM_CLASSE.exec(codigo);
        if (achado) infratores.push(`${relativo}:${i + 1} → ${achado[0]}`);
      });
  }

  assert.deepEqual(
    infratores,
    [],
    `Use os tokens de globals.css em vez de cor literal:\n${infratores.join("\n")}`,
  );
});

test("a lista de pendentes só encolhe", () => {
  // Se este número subir num PR, a pergunta certa é por quê.
  assert.ok(
    AINDA_NAO_CONVERTIDOS.size <= 1,
    `Arquivos sem token: ${[...AINDA_NAO_CONVERTIDOS].join(", ")}`,
  );
});
