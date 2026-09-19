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

function token(name) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `token --${name} not found in globals.css`);
  return match[1];
}

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
];

test("text meets WCAG 2.1 AA contrast", () => {
  for (const [front, back] of TEXT_PAIRS) {
    const ratio = contrast(token(front), token(back));
    assert.ok(
      ratio >= TEXT_MINIMUM,
      `--${front} on --${back} is ${ratio.toFixed(2)}:1, needs ${TEXT_MINIMUM}:1`,
    );
  }
});

test("component outlines and indicators meet WCAG 2.1 AA contrast", () => {
  for (const [front, back] of NON_TEXT_PAIRS) {
    const ratio = contrast(token(front), token(back));
    assert.ok(
      ratio >= NON_TEXT_MINIMUM,
      `--${front} on --${back} is ${ratio.toFixed(2)}:1, needs ${NON_TEXT_MINIMUM}:1`,
    );
  }
});

test("dark mode is declared so night-shift screens are not inverted by the browser", () => {
  assert.match(css, /color-scheme:\s*dark/);
});
