import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

// RNF-10 asks for WCAG 2.1 AA, and the issue #15 wording is "contraste legível".
// Reading the tokens straight from the stylesheet turns that from a review
// opinion into a build gate: a future palette tweak that dims a colour below
// threshold fails here instead of on a juror's phone in a lit factory.
const require = createRequire(import.meta.url);
const css = readFileSync(require.resolve("../src/styles/globals.css"), "utf8");

// Os tokens existem duas vezes: claro em `:root` e escuro em
// `:root[data-theme="dark"]`. Ler so o primeiro deixaria metade do produto sem
// guarda, e e justamente o tema que a maioria usa a noite.
function block(selector) {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, `block ${selector} not found in globals.css`);
  const end = css.indexOf("\n}", start);
  assert.notEqual(end, -1, `block ${selector} is not closed`);
  return css.slice(start, end);
}

function palette(selector) {
  const source = block(selector);
  return (name) => {
    const match = source.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(match, `token --${name} not found in ${selector}`);
    return match[1];
  };
}

const THEMES = [
  ["light", palette(":root {")],
  ["dark", palette(":root.dark {")],
];

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) =>
    channel(parseInt(hex.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [first, second] = [luminance(a), luminance(b)];
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

// SC 1.4.3 for text, SC 1.4.11 for the outlines and indicators that identify a
// component. Only pairs the journey actually renders are listed.
const TEXT_MINIMUM = 4.5;
const NON_TEXT_MINIMUM = 3;

const TEXT_PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["primary", "background"],
  ["primary-foreground", "primary"],
  ["destructive", "background"],
  ["destructive", "card"],
  // ChoiceField paints the selected option, and every option on hover, with
  // bg-muted. Its label and hint land on that surface.
  ["foreground", "muted"],
  ["muted-foreground", "muted"],
  ["destructive", "muted"],
  // The CVV 188 link in SupportPaths is primary text on a muted panel. It is
  // the one link someone in distress has to be able to read, so it is held to
  // the text threshold rather than the outline one.
  ["primary", "muted"],
];

const NON_TEXT_PAIRS = [
  // Input, card and unselected option outlines: the only thing saying where a
  // field begins and that an option can be picked.
  ["border", "background"],
  ["border", "card"],
  // Same outline once the option is hovered and the surface turns to muted.
  ["border", "muted"],
  // Focus ring, the filled part of the trajectory bar, and the outline of the
  // option or mood button that is currently selected.
  ["primary", "background"],
  ["primary", "card"],
  // O âmbar dos marcos conquistados contorna a etiqueta "Conquistado" sobre o
  // cartão. O tom do escuro desaparece sobre branco, então cada tema tem o seu:
  // sem este par, trocar um deles passaria no CI e sumiria no celular.
  ["achievement-trajectory", "card"],
  ["achievement-trajectory", "muted"],
];

test("text meets WCAG 2.1 AA contrast in both themes", () => {
  for (const [theme, token] of THEMES) {
    for (const [front, back] of TEXT_PAIRS) {
      const ratio = contrast(token(front), token(back));
      assert.ok(
        ratio >= TEXT_MINIMUM,
        `${theme}: --${front} on --${back} is ${ratio.toFixed(2)}:1, needs ${TEXT_MINIMUM}:1`,
      );
    }
  }
});

test("component outlines and indicators meet WCAG 2.1 AA contrast in both themes", () => {
  for (const [theme, token] of THEMES) {
    for (const [front, back] of NON_TEXT_PAIRS) {
      const ratio = contrast(token(front), token(back));
      assert.ok(
        ratio >= NON_TEXT_MINIMUM,
        `${theme}: --${front} on --${back} is ${ratio.toFixed(2)}:1, needs ${NON_TEXT_MINIMUM}:1`,
      );
    }
  }
});

test("both schemes are declared so the browser does not invent one", () => {
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /color-scheme:\s*dark/);
  // Sem a media query, quem nunca tocou no seletor fica preso no claro mesmo
  // com o sistema em escuro.
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
});
