import assert from "node:assert/strict";
import test from "node:test";
import {
  trailGeometry,
  trailPath,
  trailPoints,
} from "../src/components/journey/trail-geometry.ts";

test("gera uma posição por nó, em qualquer quantidade", () => {
  for (const n of [1, 5, 6, 20]) {
    assert.equal(trailPoints(n).length, n);
    assert.equal(trailGeometry(n).points.length, n);
  }
});

test("o y cresce de forma monotônica: a trilha desce", () => {
  const points = trailPoints(6);
  for (let i = 1; i < points.length; i += 1) {
    assert.ok(points[i].y > points[i - 1].y, `y[${i}] deveria descer`);
  }
});

test("o x serpenteia entre as margens, sem estourar a largura", () => {
  const { points, width } = trailGeometry(8);
  for (const p of points) {
    assert.ok(p.x >= 0 && p.x <= width, `x fora do viewBox: ${p.x}`);
  }
  // Vaivém: o segundo nó cai para um lado e o quarto para o outro.
  assert.notEqual(points[1].x, points[0].x);
  assert.ok(
    Math.sign(points[1].x - points[0].x) !==
      Math.sign(points[3].x - points[0].x),
    "os nós ímpares deveriam alternar de lado",
  );
});

test("a altura acompanha o número de nós", () => {
  assert.ok(trailGeometry(6).height > trailGeometry(5).height);
});

test("o path costura todos os nós: começa no primeiro e tem uma curva por segmento", () => {
  const points = trailPoints(5);
  const d = trailPath(points);
  assert.ok(d.startsWith(`M ${points[0].x},${points[0].y}`));
  // Uma cúbica (C) por segmento => n-1 curvas.
  assert.equal((d.match(/C/g) ?? []).length, points.length - 1);
});

test("menos de dois nós não desenham caminho", () => {
  assert.equal(trailPath(trailPoints(1)), "");
  assert.equal(trailPath([]), "");
  assert.equal(trailGeometry(0).points.length, 0);
});
