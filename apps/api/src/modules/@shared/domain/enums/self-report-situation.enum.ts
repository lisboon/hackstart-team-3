export enum SelfReportSituation {
  SURPLUS = "SURPLUS",
  BREAK_EVEN = "BREAK_EVEN",
  SLIGHT_SHORTFALL = "SLIGHT_SHORTFALL",
  SEVERE_SHORTFALL = "SEVERE_SHORTFALL",
}

/**
 * A declaração é ordinal, não nominal: comparar meses exige um número.
 * A escala existe só para a média móvel da própria pessoa — nunca para
 * ranquear pessoas entre si.
 */
export const SELF_REPORT_SCORE: Readonly<Record<SelfReportSituation, number>> =
  {
    [SelfReportSituation.SURPLUS]: 3,
    [SelfReportSituation.BREAK_EVEN]: 2,
    [SelfReportSituation.SLIGHT_SHORTFALL]: 1,
    [SelfReportSituation.SEVERE_SHORTFALL]: 0,
  };
