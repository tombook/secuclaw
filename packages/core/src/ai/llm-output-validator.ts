export interface ValidationRequest {
  content: string;
  sourceReferences: string[];
  metadata?: {
    modelId?: string;
    requestId?: string;
  };
}

export interface HallucinationSegment {
  segment: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidenceScore: number;
  hallucinations: HallucinationSegment[];
  validationId: string;
}

const SUSPECT_PATTERNS: Array<{ pattern: RegExp; severity: HallucinationSegment['severity']; reason: string }> = [
  { pattern: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, severity: 'medium', reason: 'Looks like a fake card/ID number' },
  { pattern: /CVE-\d{4}-\d{4,}/g, severity: 'high', reason: 'CVE ID may not exist — verify against NVD' },
  { pattern: /\b(?:100%|guaranteed|always|never)\b/gi, severity: 'low', reason: 'Absolute language is suspicious in security analysis' },
  { pattern: /\b(?:I think|I believe|probably|maybe)\b/gi, severity: 'low', reason: 'Uncertain language indicates low confidence' },
];

export function validateLLMOutput(request: ValidationRequest): ValidationResult {
  const { content, sourceReferences } = request;
  const hallucinations: HallucinationSegment[] = [];

  for (const { pattern, severity, reason } of SUSPECT_PATTERNS) {
    const matches = content.matchAll(pattern instanceof RegExp ? (pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`)) : pattern);
    for (const match of matches) {
      hallucinations.push({ segment: match[0], severity, reason });
    }
  }

  const refCoverage = sourceReferences.length > 0
    ? sourceReferences.filter(ref => content.toLowerCase().includes(ref.toLowerCase())).length / sourceReferences.length
    : 0;

  const highCount = hallucinations.filter(h => h.severity === 'high').length;
  const mediumCount = hallucinations.filter(h => h.severity === 'medium').length;

  let confidence = 100;
  confidence -= highCount * 25;
  confidence -= mediumCount * 10;
  confidence -= hallucinations.filter(h => h.severity === 'low').length * 3;
  confidence = Math.round(Math.max(0, Math.min(100, confidence + refCoverage * 15)));

  const isValid = confidence >= 70 && highCount === 0;

  return {
    isValid,
    confidenceScore: confidence,
    hallucinations,
    validationId: `val_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function validateWithThreshold(request: ValidationRequest, threshold: number): ValidationResult & { passed: boolean } {
  const result = validateLLMOutput(request);
  return { ...result, passed: result.confidenceScore >= threshold };
}
