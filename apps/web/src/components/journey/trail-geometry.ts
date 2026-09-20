/**
 * Geometria procedural da trilha, para o caminho não ser mais hard-coded.
 *
 * A ideia é a mesma dos mapas serpenteantes estilo Duolingo: cada nó ganha uma
 * posição calculada — o x oscila numa senoide entre as margens, o y desce
 * linearmente com o índice — e o caminho é uma curva suave (Bézier) ligando
 * esses pontos. Assim vale para qualquer quantidade de peças (5, 6, 20…), em
 * vez de posições fixas que quebram quando o catálogo cresce.
 */

export interface TrailPoint {
  x: number;
  y: number;
}

export interface TrailGeometry {
  /** Largura do viewBox. Fixa: o mapa vive numa coluna estreita de celular. */
  width: number;
  /** Altura do viewBox, proporcional ao número de nós. */
  height: number;
  /** Centro de cada nó, na ordem da trilha. */
  points: TrailPoint[];
  /** O atributo `d` do caminho que costura os nós, ou "" se houver menos de 2. */
  path: string;
}

const WIDTH = 320;
const MARGIN_X = 60; // afastamento das bordas no ponto mais lateral
const STEP_Y = 92; // distância vertical entre nós
const PADDING_Y = 56; // respiro no topo e na base

/**
 * As posições dos nós. O x segue um seno do índice, então os nós serpenteiam
 * de um lado para o outro; o y é linear. `amplitude` é metade da faixa
 * horizontal útil.
 */
export function trailPoints(count: number): TrailPoint[] {
  const center = WIDTH / 2;
  const amplitude = center - MARGIN_X;
  return Array.from({ length: count }, (_, i) => ({
    // O quarto de volta (i * π/2) dá o vaivém característico: centro, lado,
    // centro, outro lado. Arredondar evita coordenadas com ruído de ponto
    // flutuante no atributo do SVG.
    x: Math.round(center + amplitude * Math.sin((i * Math.PI) / 2)),
    y: PADDING_Y + i * STEP_Y,
  }));
}

/**
 * O caminho suave entre os pontos. Usa uma Bézier cúbica por segmento, com as
 * alças no meio da altura do segmento — o que dá a curva em S contínua, sem
 * bico nos nós. Menos de dois pontos não desenham caminho.
 */
export function trailPath(points: TrailPoint[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    // Alças verticais no meio do segmento: a tangente entra e sai reta no nó,
    // e a curva faz a barriga para o lado sozinha.
    d += ` C ${prev.x},${midY} ${curr.x},${midY} ${curr.x},${curr.y}`;
  }
  return d;
}

export function trailGeometry(count: number): TrailGeometry {
  const points = trailPoints(count);
  const height =
    count > 0 ? PADDING_Y * 2 + (count - 1) * STEP_Y : PADDING_Y * 2;
  return { width: WIDTH, height, points, path: trailPath(points) };
}
