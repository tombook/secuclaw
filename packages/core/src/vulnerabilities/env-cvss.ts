type RequirementLevel = 'high' | 'medium' | 'low';
type ModifiedAttackVector = 'network' | 'adjacent' | 'local' | 'physical';
type ModifiedAttackComplexity = 'high' | 'low';
type ModifiedPrivilegesRequired = 'high' | 'low' | 'none';
type ModifiedUserInteraction = 'required' | 'none';
type ModifiedScope = 'changed' | 'unchanged';
type ModifiedCiaLevel = 'high' | 'low' | 'none';

const requirementMultipliers: Record<RequirementLevel, number> = {
  high: 1.5,
  medium: 1.0,
  low: 0.5,
};

const attackVectorWeights: Record<ModifiedAttackVector, number> = {
  network: 0.85,
  adjacent: 0.62,
  local: 0.55,
  physical: 0.2,
};

const attackComplexityWeights: Record<ModifiedAttackComplexity, number> = {
  low: 0.77,
  high: 0.44,
};

const privilegesRequiredWeights: Record<ModifiedScope, Record<ModifiedPrivilegesRequired, number>> = {
  unchanged: { none: 0.85, low: 0.62, high: 0.27 },
  changed: { none: 0.85, low: 0.68, high: 0.5 },
};

const userInteractionWeights: Record<ModifiedUserInteraction, number> = {
  none: 0.85,
  required: 0.62,
};

const ciaWeights: Record<ModifiedCiaLevel, number> = {
  high: 0.56,
  low: 0.22,
  none: 0,
};

export interface EnvFactors {
  confidentialityRequirement?: RequirementLevel;
  integrityRequirement?: RequirementLevel;
  availabilityRequirement?: RequirementLevel;
  modifiedAttackVector?: ModifiedAttackVector;
  modifiedAttackComplexity?: ModifiedAttackComplexity;
  modifiedPrivilegesRequired?: ModifiedPrivilegesRequired;
  modifiedUserInteraction?: ModifiedUserInteraction;
  modifiedScope?: ModifiedScope;
  modifiedConfidentiality?: ModifiedCiaLevel;
  modifiedIntegrity?: ModifiedCiaLevel;
  modifiedAvailability?: ModifiedCiaLevel;
}

export function calculateEnvCvss(
  baseScore: number,
  envFactors: EnvFactors
): { score: number; modifiedBase: number; environmental: number; factors: Record<string, string> } {
  void baseScore;
  const factors: Record<string, string> = {};
  for (const [k, v] of Object.entries(envFactors)) {
    if (v !== undefined) factors[k] = String(v);
  }

  const cr = envFactors.confidentialityRequirement ?? 'medium';
  const ir = envFactors.integrityRequirement ?? 'medium';
  const ar = envFactors.availabilityRequirement ?? 'medium';
  const mav = envFactors.modifiedAttackVector ?? 'network';
  const mac = envFactors.modifiedAttackComplexity ?? 'low';
  const mpr = envFactors.modifiedPrivilegesRequired ?? 'none';
  const mui = envFactors.modifiedUserInteraction ?? 'none';
  const ms = envFactors.modifiedScope ?? 'unchanged';
  const mc = envFactors.modifiedConfidentiality ?? 'high';
  const mi = envFactors.modifiedIntegrity ?? 'high';
  const ma = envFactors.modifiedAvailability ?? 'high';

  const iss =
    (ciaWeights[mc] * requirementMultipliers[cr] +
      ciaWeights[mi] * requirementMultipliers[ir] +
      ciaWeights[ma] * requirementMultipliers[ar]) /
    3;

  const exploitability =
    8.22 *
    attackVectorWeights[mav] *
    attackComplexityWeights[mac] *
    privilegesRequiredWeights[ms][mpr] *
    userInteractionWeights[mui];

  let modifiedBase: number;
  if (iss <= 0) {
    modifiedBase = 0;
  } else if (ms === 'unchanged') {
    modifiedBase = Math.min(exploitability + iss, 10);
  } else {
    modifiedBase = Math.min(1.08 * (exploitability + iss), 10);
  }

  const environmental = modifiedBase;
  const score = Math.max(0, Math.min(10, Math.round(environmental * 10) / 10));

  return {
    score,
    modifiedBase: Math.round(modifiedBase * 10) / 10,
    environmental: Math.round(environmental * 10) / 10,
    factors,
  };
}
