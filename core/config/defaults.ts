export type BetlabConfig = {
  homeAdvantage: number;
  bbThreshold: {
    strong: number;
    weak: number;
  };
  scoring: {
    baseRuns: number;
    homeBonus: number;
    awayPenalty: number;
    parkRunFactor: number;
  };
  weights: {
    pitcher: number;
    form: number;
    batting: number;
    bullpen: number;
    lineup: number;
    park: number;
  };
};

export const DEFAULT_CONFIG: BetlabConfig = {
  homeAdvantage: 0.45,
  bbThreshold: {
    strong: 1.8,
    weak: 0.7,
  },
  scoring: {
    baseRuns: 4.6,
    homeBonus: 0.25,
    awayPenalty: -0.15,
    parkRunFactor: 0.08,
  },
  weights: {
    pitcher: 0.38,
    form: 0.14,
    batting: 0.28,
    bullpen: 0.08,
    lineup: 0.09,
    park: 0.03,
  },
};

export function normalizeConfig(input?: Partial<BetlabConfig> | null): BetlabConfig {
  return {
    homeAdvantage: Number(input?.homeAdvantage ?? DEFAULT_CONFIG.homeAdvantage),
    bbThreshold: {
      strong: Number(input?.bbThreshold?.strong ?? DEFAULT_CONFIG.bbThreshold.strong),
      weak: Number(input?.bbThreshold?.weak ?? DEFAULT_CONFIG.bbThreshold.weak),
    },
    scoring: {
      baseRuns: Number(input?.scoring?.baseRuns ?? DEFAULT_CONFIG.scoring.baseRuns),
      homeBonus: Number(input?.scoring?.homeBonus ?? DEFAULT_CONFIG.scoring.homeBonus),
      awayPenalty: Number(input?.scoring?.awayPenalty ?? DEFAULT_CONFIG.scoring.awayPenalty),
      parkRunFactor: Number(input?.scoring?.parkRunFactor ?? DEFAULT_CONFIG.scoring.parkRunFactor),
    },
    weights: {
      pitcher: Number(input?.weights?.pitcher ?? DEFAULT_CONFIG.weights.pitcher),
      form: Number(input?.weights?.form ?? DEFAULT_CONFIG.weights.form),
      batting: Number(input?.weights?.batting ?? DEFAULT_CONFIG.weights.batting),
      bullpen: Number(input?.weights?.bullpen ?? DEFAULT_CONFIG.weights.bullpen),
      lineup: Number(input?.weights?.lineup ?? DEFAULT_CONFIG.weights.lineup),
      park: Number(input?.weights?.park ?? DEFAULT_CONFIG.weights.park),
    },
  };
}
