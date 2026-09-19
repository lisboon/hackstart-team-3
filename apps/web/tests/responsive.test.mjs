import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";

// The acceptance criterion of issue #15 is "no horizontal scrolling at 390px".
// That cannot be asserted here: jsdom has no layout engine, so scrollWidth and
// clientWidth are always 0, and a test claiming otherwise would prove nothing.
// Playwright would prove it, but a new dependency is against CLAUDE.md.
//
// So this file guards the causes that a review misses, and the demo checklist
// covers the symptom in a real browser.

const require = createRequire(import.meta.url);
const ROOT = path.resolve(
  path.dirname(require.resolve("../src/app/layout.tsx")),
  "..",
);

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const FILES = sourceFiles(ROOT).map((file) => ({
  file: path.relative(ROOT, file),
  source: readFileSync(file, "utf8"),
}));

test("the scan actually reaches the source tree", () => {
  // Without this, a broken path would make every check below pass on an empty
  // list and the guard would be decoration.
  assert.ok(FILES.length > 20, `only ${FILES.length} files scanned in ${ROOT}`);
  assert.ok(FILES.some(({ file }) => file === "app/layout.tsx"));
});

// The narrowest phone the journey targets. A factory-floor worker's screen.
const VIEWPORT = 390;

test("no element is pinned wider than a 390px viewport", () => {
  // Tailwind arbitrary values such as w-[420px] or min-w-[36rem]. A min-width
  // above the viewport forces the page to scroll sideways no matter what the
  // parent does.
  const pattern = /\b(?:min-)?w-\[(\d+(?:\.\d+)?)(px|rem)\]/g;
  const offenders = [];

  for (const { file, source } of FILES) {
    for (const [match, size, unit] of source.matchAll(pattern)) {
      const pixels = unit === "rem" ? Number(size) * 16 : Number(size);
      if (pixels > VIEWPORT) offenders.push(`${file}: ${match} (${pixels}px)`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `fixed widths wider than ${VIEWPORT}px force horizontal scrolling`,
  );
});

test("the journey never suppresses zoom", () => {
  const layout = FILES.find(({ file }) => file === "app/layout.tsx");
  assert.ok(layout, "app/layout.tsx not found");

  // WCAG 2.1 SC 1.4.4: text has to survive being enlarged. Locking the viewport
  // is a one-line change that silently breaks anyone who needs bigger type.
  assert.doesNotMatch(layout.source, /userScalable:\s*false/);
  assert.doesNotMatch(layout.source, /maximumScale:\s*1\b/);
  assert.match(layout.source, /userScalable:\s*true/);
  assert.match(layout.source, /width:\s*"device-width"/);
});

test("the shell keeps text off the bezel", () => {
  const shell = FILES.find(
    ({ file }) => file === "components/layout/app-shell.tsx",
  );
  assert.ok(shell, "app-shell.tsx not found");
  assert.match(shell.source, /\bpx-\d/);
});

test("the card primitive can shrink below its content", () => {
  const card = FILES.find(({ file }) => file === "components/ui/card.tsx");
  assert.ok(card, "components/ui/card.tsx not found");

  // Card wraps every screen of the journey and lays out as a grid. A grid item
  // defaults to min-width:auto, so without min-w-0 one long unbroken string
  // widens the card past the viewport and the whole page scrolls sideways.
  assert.match(card.source, /\bmin-w-0\b/);
});

test("long unbroken strings break instead of widening the page", () => {
  const css = readFileSync(
    require.resolve("../src/styles/globals.css"),
    "utf8",
  );

  // The usual cause of sideways scrolling on a phone is a single long token: a
  // source URL, an e-mail, a pasted answer. It only shows up with real data, so
  // the defence is a base rule rather than a review habit.
  assert.match(css, /overflow-wrap:\s*break-word/);
});
