import { describe, expect, it } from "vitest";
import {
  GROWTH_STAGES,
  growthProgress,
} from "@/components/journey/growth-stage";

/**
 * Semente → broto → muda → planta → fruto é **nível individual**, e a regra
 * que importa aqui é negativa: não existe queda, não existe divisão e nada
 * neste módulo conhece outra pessoa. Liga é comparação, e comparação continua
 * vedada (`CLAUDE.md`).
 */
describe("growthProgress", () => {
  it("começa em semente, com zero ponto", () => {
    expect(growthProgress(0).stage.key).toBe("semente");
  });

  it("sobe um estágio a cada etapa do COOPS concluída", () => {
    // 90 pontos = seis peças = uma etapa.
    expect(growthProgress(89).stage.key).toBe("semente");
    expect(growthProgress(90).stage.key).toBe("broto");
    expect(growthProgress(180).stage.key).toBe("muda");
    expect(growthProgress(270).stage.key).toBe("planta");
    expect(growthProgress(360).stage.key).toBe("fruto");
  });

  it("diz quanto falta para o próximo, e nada além disso", () => {
    const progresso = growthProgress(100);
    expect(progresso.stage.key).toBe("broto");
    expect(progresso.next?.key).toBe("muda");
    expect(progresso.toNext).toBe(80);
  });

  it("para de prometer estágio quando chega ao fruto", () => {
    const fim = growthProgress(450);
    expect(fim.stage.key).toBe("fruto");
    expect(fim.next).toBeNull();
    expect(fim.toNext).toBe(0);
    expect(fim.ratio).toBe(1);
  });

  it("nunca devolve razão fora de zero e um", () => {
    for (const pontos of [0, 45, 89, 90, 269, 359, 360, 10_000]) {
      const { ratio } = growthProgress(pontos);
      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(1);
    }
  });

  it("não cai: mais pontos nunca devolvem estágio anterior", () => {
    // Estágio que se perde transforma progresso em dívida, e é o oposto do
    // produto — a mesma razão pela qual a ofensiva não zera no feriado.
    let anterior = -1;
    for (let pontos = 0; pontos <= 500; pontos += 5) {
      const indice = GROWTH_STAGES.indexOf(growthProgress(pontos).stage);
      expect(indice).toBeGreaterThanOrEqual(anterior);
      anterior = indice;
    }
  });

  it("tem cinco estágios, em ordem crescente de pontos", () => {
    expect(GROWTH_STAGES.map((s) => s.key)).toEqual([
      "semente",
      "broto",
      "muda",
      "planta",
      "fruto",
    ]);
    for (let i = 1; i < GROWTH_STAGES.length; i += 1) {
      expect(GROWTH_STAGES[i].from).toBeGreaterThan(GROWTH_STAGES[i - 1].from);
    }
  });
});
