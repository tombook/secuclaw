import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

export interface AigFinding {
  skillId: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'prompt-injection' | 'tool-poisoning' | 'data-exfil' | 'jailbreak' | 'supply-chain' | 'misconfiguration';
  description: string;
  evidence: string;
  mitreAttack?: string;
  remediation: string;
}

export interface AigScanResult {
  scanId: string;
  timestamp: number;
  totalSkills: number;
  scannedSkills: number;
  findings: AigFinding[];
  summary: Record<string, number>;
  duration: number;
}

export class AigScanner {
  constructor(private aigBinaryPath = 'aig') {}

  async scanAllSkills(skillsPath: string): Promise<AigScanResult> {
    const scanId = `aig-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const startTime = Date.now();

    let entries: string[];
    try {
      entries = await readdir(skillsPath);
    } catch {
      return {
        scanId,
        timestamp: startTime,
        totalSkills: 0,
        scannedSkills: 0,
        findings: [],
        summary: {},
        duration: Date.now() - startTime,
      };
    }

    const skillDirs = entries.filter((e) => !e.startsWith('.'));
    const totalSkills = skillDirs.length;
    const allFindings: AigFinding[] = [];
    let scannedSkills = 0;

    for (const dir of skillDirs) {
      const skillFilePath = join(skillsPath, dir, 'SKILL.md');
      try {
        await readFile(skillFilePath, 'utf-8');
      } catch {
        continue;
      }

      try {
        const findings = await this.scanSkill(dir, skillFilePath);
        allFindings.push(...findings);
        scannedSkills++;
      } catch {
        scannedSkills++;
      }
    }

    const summary = this.buildSummary(allFindings);

    return {
      scanId,
      timestamp: startTime,
      totalSkills,
      scannedSkills,
      findings: allFindings,
      summary,
      duration: Date.now() - startTime,
    };
  }

  async scanSkill(skillId: string, filePath: string): Promise<AigFinding[]> {
    return new Promise<AigFinding[]>((resolve, reject) => {
      const proc = spawn(this.aigBinaryPath, ['scan', '--file', filePath, '--format', 'json']);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code: number) => {
        if (code !== 0 && !stdout.trim()) {
          reject(new Error(`aig scan exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const findings = this.parseAigOutput(stdout);
          resolve(findings.map((f) => ({ ...f, skillId })));
        } catch {
          resolve([]);
        }
      });

      proc.on('error', (err: Error) => {
        reject(new Error(`Failed to spawn aig: ${err.message}`));
      });
    });
  }

  private parseAigOutput(json: string): AigFinding[] {
    const parsed = JSON.parse(json);
    const rawFindings = parsed.findings ?? parsed.results ?? [];

    return rawFindings.map((f: Record<string, unknown>) => ({
      skillId: '',
      riskLevel: this.normalizeRiskLevel(String(f.riskLevel ?? f.severity ?? 'info')),
      category: this.normalizeCategory(String(f.category ?? f.type ?? 'misconfiguration')),
      description: String(f.description ?? f.message ?? ''),
      evidence: String(f.evidence ?? f.match ?? ''),
      mitreAttack: f.mitreAttack ?? f.mitre_attack ?? f.mitre ?? undefined
        ? String(f.mitreAttack ?? f.mitre_attack ?? f.mitre)
        : undefined,
      remediation: String(f.remediation ?? f.fix ?? f.recommendation ?? ''),
    }));
  }

  quickScan(content: string): AigFinding[] {
    const findings: AigFinding[] = [];
    const skillId = 'quick-scan';
    const lines = content.split('\n');

    const urlPatterns = /(?:fetch|axios|request|http\.get|urllib|wget|curl)\s*\(|https?:\/\/[^\s)]+/gi;
    let match: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((match = urlPatterns.exec(content)) !== null) {
      const evidence = match[0];
      if (seen.has(evidence)) continue;
      seen.add(evidence);

      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        skillId,
        riskLevel: 'medium',
        category: 'misconfiguration',
        description: 'Potential SSRF risk: URL fetch or HTTP request detected',
        evidence: `Line ${lineNumber}: ${evidence}`,
        remediation: 'Validate and restrict URLs to allowed domains; avoid arbitrary URL fetching from user-controlled input',
      });
      break;
    }

    const evalPatterns = /(?:eval|exec|Function\(|child_process|subprocess|os\.system|os\.popen)\s*\(/gi;
    while ((match = evalPatterns.exec(content)) !== null) {
      const evidence = match[0];
      if (seen.has(evidence)) continue;
      seen.add(evidence);

      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        skillId,
        riskLevel: 'critical',
        category: 'prompt-injection',
        description: 'Dynamic code execution detected: eval/exec or subprocess call',
        evidence: `Line ${lineNumber}: ${evidence}`,
        remediation: 'Avoid eval/exec calls; use safe alternatives and sandboxed execution environments',
      });
      break;
    }

    const secretPatterns = /(?:password|secret|api[_-]?key|token|credential|private[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/gi;
    while ((match = secretPatterns.exec(content)) !== null) {
      const evidence = match[0].replace(/['"][^'"]{8,}['"]/, '"[REDACTED]"');
      if (seen.has(evidence)) continue;
      seen.add(evidence);

      const lineNumber = content.substring(0, match.index).split('\n').length;
      findings.push({
        skillId,
        riskLevel: 'high',
        category: 'data-exfil',
        description: 'Potential hardcoded secret or credential detected',
        evidence: `Line ${lineNumber}: ${evidence}`,
        remediation: 'Use environment variables or secret management systems instead of hardcoding credentials',
      });
      break;
    }

    const hasSecurityConstraint = /(?:security|sanitize|validate|escape|encode|sandbox|permission|auth|restrict)/i.test(content);
    if (!hasSecurityConstraint && content.length > 200) {
      findings.push({
        skillId,
        riskLevel: 'medium',
        category: 'misconfiguration',
        description: 'No security constraints detected in skill definition',
        evidence: 'No security-related keywords found in SKILL.md content',
        remediation: 'Add explicit security constraints, input validation requirements, and permission boundaries to the skill definition',
      });
    }

    return findings;
  }

  buildSummary(findings: AigFinding[]): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const finding of findings) {
      summary[finding.riskLevel] = (summary[finding.riskLevel] ?? 0) + 1;
      summary[finding.category] = (summary[finding.category] ?? 0) + 1;
    }

    summary['total'] = findings.length;
    return summary;
  }

  private normalizeRiskLevel(level: string): AigFinding['riskLevel'] {
    const normalized = level.toLowerCase().trim();
    if (normalized === 'critical') return 'critical';
    if (normalized === 'high') return 'high';
    if (normalized === 'medium') return 'medium';
    if (normalized === 'low') return 'low';
    return 'info';
  }

  private normalizeCategory(cat: string): AigFinding['category'] {
    const normalized = cat.toLowerCase().trim();
    if (normalized.includes('prompt') && normalized.includes('injection')) return 'prompt-injection';
    if (normalized.includes('tool') && normalized.includes('poison')) return 'tool-poisoning';
    if (normalized.includes('data') && normalized.includes('exfil')) return 'data-exfil';
    if (normalized.includes('jailbreak')) return 'jailbreak';
    if (normalized.includes('supply') && normalized.includes('chain')) return 'supply-chain';
    return 'misconfiguration';
  }
}
