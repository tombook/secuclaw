interface IncidentLike {
  category?: string;
  severity?: string;
  attackVector?: string;
  mitreTechniques?: string[];
}

interface ThreatIndicator {
  type: string;
  value: string;
}

interface MitreTechniqueRef {
  id: string;
  externalId: string;
  name: string;
  tactics: string[];
}

interface MitreMappingResult {
  tactic: string;
  tacticId: string;
  technique: string;
  techniqueId: string;
  confidence: number;
}

const CATEGORY_TACTIC_MAP: Record<string, Array<{ tactic: string; tacticId: string; confidence: number }>> = {
  intrusion: [
    { tactic: 'Initial Access', tacticId: 'TA0001', confidence: 0.9 },
    { tactic: 'Execution', tacticId: 'TA0002', confidence: 0.6 },
  ],
  malware: [
    { tactic: 'Execution', tacticId: 'TA0002', confidence: 0.9 },
    { tactic: 'Persistence', tacticId: 'TA0003', confidence: 0.7 },
  ],
  data_breach: [
    { tactic: 'Exfiltration', tacticId: 'TA0010', confidence: 0.9 },
    { tactic: 'Collection', tacticId: 'TA0009', confidence: 0.7 },
  ],
  denial_of_service: [
    { tactic: 'Impact', tacticId: 'TA0040', confidence: 0.9 },
  ],
  insider_threat: [
    { tactic: 'Credential Access', tacticId: 'TA0006', confidence: 0.8 },
    { tactic: 'Lateral Movement', tacticId: 'TA0008', confidence: 0.6 },
  ],
  phishing: [
    { tactic: 'Initial Access', tacticId: 'TA0001', confidence: 0.95 },
    { tactic: 'Credential Access', tacticId: 'TA0006', confidence: 0.7 },
  ],
  vulnerability: [
    { tactic: 'Initial Access', tacticId: 'TA0001', confidence: 0.8 },
    { tactic: 'Privilege Escalation', tacticId: 'TA0004', confidence: 0.6 },
  ],
  configuration: [
    { tactic: 'Defense Evasion', tacticId: 'TA0005', confidence: 0.7 },
  ],
};

const ATTACK_VECTOR_TECHNIQUES: Record<string, Array<{ techniqueId: string; name: string; confidence: number }>> = {
  network: [
    { techniqueId: 'T1190', name: 'Exploit Public-Facing Application', confidence: 0.8 },
    { techniqueId: 'T1071', name: 'Application Layer Protocol', confidence: 0.6 },
  ],
  email: [
    { techniqueId: 'T1566', name: 'Phishing', confidence: 0.9 },
  ],
  physical: [
    { techniqueId: 'T1192', name: 'Supply Chain Compromise', confidence: 0.5 },
  ],
};

const COMMON_TECHNIQUES: Array<Omit<MitreTechniqueRef, 'id'>> = [
  { externalId: 'T1059', name: 'Command and Scripting Interpreter', tactics: ['Execution'] },
  { externalId: 'T1053', name: 'Scheduled Task/Job', tactics: ['Execution', 'Persistence'] },
  { externalId: 'T1078', name: 'Valid Accounts', tactics: ['Initial Access', 'Persistence'] },
  { externalId: 'T1082', name: 'System Information Discovery', tactics: ['Discovery'] },
  { externalId: 'T1046', name: 'Network Service Discovery', tactics: ['Discovery'] },
  { externalId: 'T1562', name: 'Impair Defenses', tactics: ['Defense Evasion'] },
  { externalId: 'T1070', name: 'Indicator Removal', tactics: ['Defense Evasion'] },
  { externalId: 'T1486', name: 'Data Encrypted for Impact', tactics: ['Impact'] },
];

export function matchTactics(incident: IncidentLike): MitreMappingResult[] {
  const results: MitreMappingResult[] = [];
  const category = incident.category ?? 'other';
  const tacticMappings = CATEGORY_TACTIC_MAP[category] ?? [];

  for (const mapping of tacticMappings) {
    results.push({
      tactic: mapping.tactic,
      tacticId: mapping.tacticId,
      technique: '',
      techniqueId: '',
      confidence: mapping.confidence,
    });
  }

  return results;
}

export function matchTechniques(
  incident: IncidentLike,
  _indicators?: ThreatIndicator[],
): MitreMappingResult[] {
  const results: MitreMappingResult[] = [];

  if (incident.mitreTechniques && incident.mitreTechniques.length > 0) {
    for (const techId of incident.mitreTechniques) {
      const ref = COMMON_TECHNIQUES.find(t => t.externalId === techId);
      if (ref) {
        for (const tactic of ref.tactics) {
          results.push({
            tactic,
            tacticId: '',
            technique: ref.name,
            techniqueId: ref.externalId,
            confidence: 0.95,
          });
        }
      } else {
        results.push({
          tactic: '',
          tacticId: '',
          technique: techId,
          techniqueId: techId,
          confidence: 0.5,
        });
      }
    }
  }

  if (incident.attackVector) {
    const vectorTechs = ATTACK_VECTOR_TECHNIQUES[incident.attackVector] ?? [];
    for (const tech of vectorTechs) {
      results.push({
        tactic: '',
        tacticId: '',
        technique: tech.name,
        techniqueId: tech.techniqueId,
        confidence: tech.confidence,
      });
    }
  }

  return results;
}

export function fullMapping(incident: IncidentLike): MitreMappingResult[] {
  const tactics = matchTactics(incident);
  const techniques = matchTechniques(incident);

  const combined: MitreMappingResult[] = [];
  for (const t of tactics) {
    const matchedTech = techniques.find(tech => tech.techniqueId);
    combined.push({
      ...t,
      technique: matchedTech?.technique ?? '',
      techniqueId: matchedTech?.techniqueId ?? '',
      confidence: matchedTech ? Math.max(t.confidence, matchedTech.confidence) : t.confidence,
    });
  }

  for (const tech of techniques) {
    if (!combined.some(c => c.techniqueId === tech.techniqueId && c.techniqueId !== '')) {
      combined.push(tech);
    }
  }

  return combined;
}

export function getCommonTechniques(): MitreTechniqueRef[] {
  return COMMON_TECHNIQUES.map(t => ({ id: t.externalId, ...t }));
}
