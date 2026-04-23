#!/usr/bin/env python3
"""Bulk enhance panels to 1500+ lines with domain-specific content.
Uses string concatenation instead of .format() to avoid brace conflicts with Lit templates."""

import os

PANELS_DIR = '/Users/tombook/Documents/work/ai_openclaw/dev_work/secuclaw/ui/src/components/tool-panels/panels'

def make_pipeline_phases(phases):
    lines = []
    for i, (name, status, progress, duration) in enumerate(phases):
        lines.append("    { id: 'ph-" + str(i+1) + "', name: '" + name + "', status: '" + status + "', progress: " + str(progress) + ", duration: " + str(duration) + ", errors: [], rollbackSteps: ['Reset " + name.lower() + " state'] }")
    return ',\n'.join(lines)

def make_job_queue(jobs):
    lines = []
    for i, (name, priority, status) in enumerate(jobs):
        started = "Date.now() - " + str(280000 - i*50000) if i < 2 else '0'
        lines.append("    { id: 'job-" + str(i+1).zfill(3) + "', name: '" + name + "', priority: " + str(priority) + ", status: '" + status + "', phaseId: 'ph-" + str(i+1) + "', submittedAt: Date.now() - " + str(300000 - i*50000) + ", startedAt: " + started + " }")
    return ',\n'.join(lines)

def make_error_cats(cats):
    lines = []
    for cat, icon, count, rem in cats:
        lines.append("    { category: '" + cat + "', icon: '" + icon + "', count: " + str(count) + ", autoRemediation: '" + rem + "' }")
    return ',\n'.join(lines)

def make_grid_rows(rows):
    lines = []
    for id_, case, finding, sev, score, trend, status, assignee in rows:
        trend_str = ','.join(str(v) for v in trend)
        lines.append("    { id: '" + id_ + "', case: '" + case + "', finding: '" + finding + "', severity: '" + sev + "', riskScore: " + str(score) + ", trend: [" + trend_str + "], status: '" + status + "', assignee: '" + assignee + "' }")
    return ',\n'.join(lines)

def make_roi(scenarios):
    lines = []
    for name, inv, sav, rr, pb, npv in scenarios:
        lines.append("    { name: '" + name + "', investment: " + str(inv) + ", annualSavings: " + str(sav) + ", riskReduction: " + str(rr) + ", paybackMonths: " + str(pb) + ", npv: " + str(npv) + " }")
    return ',\n'.join(lines)

def make_risk_metrics(metrics):
    lines = []
    for metric, sle, aro, ale, cost, roi in metrics:
        lines.append("    { metric: '" + metric + "', sle: " + str(sle) + ", aro: " + str(aro) + ", ale: " + str(ale) + ", mitigationCost: " + str(cost) + ", roi: " + str(roi) + " }")
    return ',\n'.join(lines)

def make_api_endpoints(apis):
    lines = []
    for name, url, method, status, lc in apis:
        lines.append("    { name: '" + name + "', url: '" + url + "', method: '" + method + "', headers: { 'Content-Type': 'application/json' }, lastStatus: " + str(status) + ", lastCalled: '" + lc + "' }")
    return ',\n'.join(lines)

def make_webhooks(whs):
    lines = []
    for i, (name, url, events, active, lt) in enumerate(whs):
        events_str = str(events)
        lines.append("    { id: 'wh-" + str(i+1) + "', name: '" + name + "', url: '" + url + "', events: " + events_str + ", active: " + str(active).lower() + ", lastTriggered: '" + lt + "' }")
    return ',\n'.join(lines)

def make_data_sources(dss):
    lines = []
    for name, type_, status, ls, recs in dss:
        lines.append("    { name: '" + name + "', type: '" + type_ + "', status: '" + status + "', lastSync: '" + ls + "', records: " + str(recs) + " }")
    return ',\n'.join(lines)

def make_glossary(terms):
    lines = []
    for term, defn in terms:
        defn = defn.replace("'", "\\'")
        lines.append("    { term: '" + term + "', definition: '" + defn + "' }")
    return ',\n'.join(lines)

# Read the template from a separate file to avoid f-string issues
TEMPLATE_FILE = os.path.join(PANELS_DIR, '_enhancement_template.ts.txt')

def read_template():
    with open(TEMPLATE_FILE, 'r') as f:
        return f.read()

def generate_enhancement(domain, phases, jobs, errors, grid_rows, roi, risk, apis, webhooks, data_sources, glossary):
    template = read_template()
    
    replacements = [
        ('__DOMAIN__', domain),
        ('__PHASES__', make_pipeline_phases(phases)),
        ('__JOBS__', make_job_queue(jobs)),
        ('__ERRORS__', make_error_cats(errors)),
        ('__GRID_ROWS__', make_grid_rows(grid_rows)),
        ('__ROI__', make_roi(roi)),
        ('__RISK__', make_risk_metrics(risk)),
        ('__APIS__', make_api_endpoints(apis)),
        ('__WEBHOOKS__', make_webhooks(webhooks)),
        ('__DATA_SOURCES__', make_data_sources(data_sources)),
        ('__GLOSSARY__', make_glossary(glossary)),
    ]
    
    result = template
    for key, value in replacements:
        result = result.replace(key, value)
    
    return result

def enhance_file(filepath, content):
    with open(filepath, 'r') as f:
        original = f.read()
    last_brace = original.rfind('}')
    if last_brace == -1:
        print(f"ERROR: No closing brace in {filepath}")
        return False
    new_content = original[:last_brace] + content + '\n}\n'
    with open(filepath, 'w') as f:
        f.write(new_content)
    lines = new_content.count('\n') + 1
    print(f"  {os.path.basename(filepath)}: {lines} lines")
    return True

# ============================================================
# PANEL DEFINITIONS - same as before
# ============================================================

PANELS = {
    'sc-network-security-monitor': {
        'domain': 'Network Security Monitoring',
        'phases': [
            ('Capture Traffic', 'completed', 100, 30),
            ('Protocol Analysis', 'completed', 100, 45),
            ('Anomaly Detection', 'running', 67, 90),
            ('Threat Correlation', 'pending', 0, 0),
            ('Alert Generation', 'pending', 0, 0),
            ('Report Compilation', 'pending', 0, 0),
        ],
        'jobs': [
            ('Monitor DMZ bandwidth', 1, 'done'),
            ('Analyze DNS queries', 2, 'done'),
            ('Detect port scans', 3, 'processing'),
            ('Correlate IDS alerts', 2, 'queued'),
            ('Generate traffic report', 4, 'queued'),
        ],
        'errors': [
            ('Bandwidth Anomaly', 'net', 4, 'Auto-adjust threshold and re-baseline'),
            ('Protocol Violation', 'proto', 7, 'Block non-compliant traffic patterns'),
            ('DNS Tunneling Suspect', 'dns', 3, 'Enable deep DNS inspection rules'),
            ('Port Scan Detected', 'scan', 12, 'Apply rate limiting and alert SOC'),
            ('TLS Version Mismatch', 'tls', 5, 'Enforce TLS 1.2+ minimum policy'),
            ('Unexpected Outbound', 'out', 8, 'Quarantine source and investigate'),
        ],
        'grid_rows': [
            ('NSM-001', 'DMZ', 'Unusual DNS query volume from web server', 'high', 78, [60,65,70,72,74,76,78], 'investigating', 'K. Roy'),
            ('NSM-002', 'Internal', 'SSH brute force from 10.0.1.45', 'critical', 95, [80,82,85,88,90,92,95], 'escalated', 'P. Singh'),
            ('NSM-003', 'Cloud', 'Cross-VPC traffic to unknown CIDR', 'high', 82, [70,72,74,76,78,80,82], 'open', 'M. Garcia'),
            ('NSM-004', 'DMZ', 'HTTP traffic on non-standard port 8443', 'medium', 55, [40,42,44,48,50,52,55], 'mitigated', 'J. Lee'),
            ('NSM-005', 'Internal', 'Large data exfil pattern detected', 'critical', 91, [75,78,82,85,87,89,91], 'open', 'A. Chen'),
            ('NSM-006', 'Cloud', 'API gateway rate limit breach attempt', 'medium', 62, [50,52,54,56,58,60,62], 'in-progress', 'R. Smith'),
        ],
        'roi': [
            ('NDR Platform Deployment', 180000, 145000, 38, 15, 380000),
            ('Network Segmentation Upgrade', 320000, 220000, 52, 18, 510000),
            ('DNS Security Layer', 45000, 38000, 15, 15, 95000),
            ('Traffic Encryption Everywhere', 95000, 72000, 25, 16, 175000),
        ],
        'risk': [
            ('Network Breach via Unmonitored Port', 5200000, 0.12, 624000, 180000, 247),
            ('Data Exfiltration via Covert Channel', 3800000, 0.2, 760000, 120000, 533),
            ('DDoS Service Disruption', 900000, 0.8, 720000, 65000, 1008),
        ],
        'apis': [
            ('Traffic Collector', '/api/v1/nsm/traffic', 'POST', 200, '30s ago'),
            ('Alert Service', '/api/v1/nsm/alerts', 'GET', 200, '1m ago'),
            ('Protocol Analyzer', '/api/v1/nsm/protocols', 'POST', 200, '2m ago'),
        ],
        'webhooks': [
            ('Critical Alert Dispatch', 'https://hooks.slack.com/T00/B00/nsm1', ['critical_alert', 'breach_detected'], True, '45m ago'),
            ('SIEM Forwarder', 'https://siem.internal/webhooks/nsm', ['all_alerts'], True, '2m ago'),
            ('On-Call PagerDuty', 'https://events.pagerduty.com/integration/xxx', ['escalation'], True, '3h ago'),
        ],
        'ds': [
            ('Core Network Switches', 'NetFlow', 'connected', '30s ago', 2345670),
            ('Cloud VPC Flow Logs', 'AWS VPC', 'connected', '1m ago', 1890340),
            ('DNS Query Logs', 'BIND', 'connected', '2m ago', 567890),
        ],
        'glossary': [
            ('NDR', 'Network Detection and Response - real-time monitoring for threats'),
            ('NetFlow', 'Cisco protocol for collecting IP traffic information'),
            ('IDS', 'Intrusion Detection System - monitors for suspicious activity'),
            ('IPS', 'Intrusion Prevention System - actively blocks detected threats'),
            ('PCAP', 'Packet Capture - raw network traffic data for analysis'),
            ('MITM', 'Man-in-the-Middle attack intercepting communications'),
            ('Beaconing', 'Periodic callback pattern from compromised hosts to C2'),
            ('DNS Tunneling', 'Covert data exfiltration using DNS protocol encoding'),
            ('East-West Traffic', 'Lateral communication between internal segments'),
            ('Zero-Day', 'Vulnerability unknown to vendor with no available patch'),
            ('Kill Chain', 'Framework describing stages of a cyber attack'),
            ('False Positive', 'Alert from legitimate activity incorrectly flagged'),
        ],
    },
    'sc-forensics-workstation': {
        'domain': 'Digital Forensics',
        'phases': [
            ('Evidence Acquisition', 'completed', 100, 120),
            ('Hash Verification (SHA-256)', 'completed', 100, 15),
            ('Disk Image Analysis', 'completed', 100, 300),
            ('Timeline Reconstruction', 'running', 55, 180),
            ('Artifact Extraction', 'pending', 0, 0),
            ('Malware Identification', 'pending', 0, 0),
            ('Report Compilation', 'pending', 0, 0),
        ],
        'jobs': [
            ('Extract browser history', 1, 'done'),
            ('Parse Windows registry', 2, 'done'),
            ('Analyze prefetch files', 3, 'processing'),
            ('Extract persistence artifacts', 2, 'queued'),
            ('Recover deleted files', 3, 'queued'),
            ('Generate hash timeline', 4, 'queued'),
        ],
        'errors': [
            ('Disk Read Error', 'disk', 2, 'Retry with lower block size'),
            ('Hash Mismatch', 'hash', 1, 'Re-acquire and verify chain of custody'),
            ('Encrypted Volume', 'enc', 3, 'Attempt password recovery'),
            ('Filesystem Corruption', 'fs', 4, 'Use raw carving tools'),
            ('Timeline Gap', 'time', 6, 'Cross-reference external logs'),
            ('Anti-Forensic Tool', 'aft', 2, 'Document and attempt recovery'),
        ],
        'grid_rows': [
            ('FR-001', 'Case Alpha', 'Suspicious PowerShell execution chain', 'critical', 92, [70,75,80,84,87,90,92], 'analyzing', 'Dr. Watson'),
            ('FR-002', 'Case Bravo', 'Unauthorized remote access tool', 'critical', 88, [65,70,75,78,82,85,88], 'confirmed', 'Agent Smith'),
            ('FR-003', 'Case Charlie', 'Data staging before exfiltration', 'high', 76, [50,55,60,64,68,72,76], 'investigating', 'Forensics Lead'),
            ('FR-004', 'Case Delta', 'Credential harvesting from memory', 'high', 82, [60,63,66,70,74,78,82], 'confirmed', 'Sr. Analyst'),
            ('FR-005', 'Case Echo', 'Rootkit persistence mechanism', 'critical', 95, [80,83,86,88,90,92,95], 'analyzing', 'Malware Team'),
            ('FR-006', 'Case Foxtrot', 'Lateral movement via pass-the-hash', 'high', 79, [55,58,62,66,70,74,79], 'open', 'IR Team'),
        ],
        'roi': [
            ('Forensics Platform License', 120000, 95000, 20, 16, 240000),
            ('Memory Analysis Toolkit', 35000, 28000, 12, 15, 78000),
            ('Automated Triage Engine', 85000, 72000, 30, 15, 195000),
            ('Cloud Forensics Capability', 150000, 110000, 25, 17, 280000),
        ],
        'risk': [
            ('Evidence Spoliation Risk', 2000000, 0.1, 200000, 45000, 344),
            ('Chain of Custody Break', 5000000, 0.05, 250000, 80000, 213),
            ('Delayed Incident Response', 3200000, 0.15, 480000, 120000, 300),
        ],
        'apis': [
            ('Evidence Repository', '/api/v1/forensics/evidence', 'POST', 200, '5m ago'),
            ('Hash Database', '/api/v1/forensics/hashes', 'GET', 200, '10m ago'),
            ('Timeline Service', '/api/v1/forensics/timeline', 'POST', 200, '15m ago'),
        ],
        'webhooks': [
            ('Case Assignment Alert', 'https://hooks.slack.com/T00/B00/for1', ['case_created', 'evidence_added'], True, '1h ago'),
            ('Report Ready', 'https://hooks.slack.com/T00/B00/for2', ['report_generated'], True, '4h ago'),
            ('Management Escalation', 'https://hooks.slack.com/T00/B00/for3', ['critical_finding'], False, 'Never'),
        ],
        'ds': [
            ('Disk Image Storage', 'RAW/E01', 'connected', '5m ago', 45),
            ('Memory Dump Archive', 'DMP/LIME', 'connected', '10m ago', 128),
            ('Network PCAP Repository', 'PCAP/JSON', 'connected', '2m ago', 2340),
        ],
        'glossary': [
            ('Chain of Custody', 'Documented trail proving evidence integrity from collection to court'),
            ('Volatility Framework', 'Open-source tool for analyzing RAM dumps'),
            ('Timeline Analysis', 'Reconstructing chronological sequence of events'),
            ('Artifact', 'Any data fragment providing evidence of system activity'),
            ('Hash Verification', 'Cryptographic checksum to verify evidence integrity'),
            ('Carving', 'Extracting files from disk images by file signatures'),
            ('Prefetch', 'Windows feature caching application launch data'),
            ('Registry Hive', 'Windows database storing configuration and activity'),
            ('MFT', 'Master File Table - NTFS filesystem metadata structure'),
            ('Anti-Forensics', 'Techniques to erase evidence of activities'),
            ('Write Blocker', 'Prevents writes to evidence media during acquisition'),
            ('Steganography', 'Hiding data within legitimate files to evade detection'),
        ],
    },
    'sc-asset-inventory-mgmt': {
        'domain': 'Asset Inventory Management',
        'phases': [
            ('Network Discovery Scan', 'completed', 100, 90),
            ('Agent Deployment Check', 'completed', 100, 45),
            ('Asset Classification', 'running', 72, 60),
            ('Criticality Assignment', 'pending', 0, 0),
            ('Dependency Mapping', 'pending', 0, 0),
            ('Compliance Tagging', 'pending', 0, 0),
            ('Inventory Report', 'pending', 0, 0),
        ],
        'jobs': [
            ('Scan 10.0.0.0/16 subnet', 1, 'done'),
            ('Query AD for assets', 2, 'done'),
            ('Fingerprint services', 3, 'processing'),
            ('Map dependencies', 2, 'queued'),
            ('Assign owner tags', 4, 'queued'),
        ],
        'errors': [
            ('Unreachable Host', 'net', 8, 'Retry with alternate credentials'),
            ('Agent Not Responding', 'scan', 12, 'Push agent update remotely'),
            ('Duplicate Asset Record', 'fs', 5, 'Merge records by MAC address'),
            ('Missing Ownership', 'time', 15, 'Auto-assign by department subnet'),
            ('EOL Software Detected', 'out', 22, 'Flag for patching and upgrade plan'),
            ('License Mismatch', 'hash', 3, 'Reconcile with license manager'),
        ],
        'grid_rows': [
            ('AST-001', 'Production', 'Unpatched RHEL 7 server in DMZ', 'critical', 88, [72,75,78,81,84,86,88], 'open', 'Infra Team'),
            ('AST-002', 'Development', 'Orphaned EC2 instance no owner', 'medium', 55, [40,42,44,48,50,52,55], 'investigating', 'Cloud Ops'),
            ('AST-003', 'Production', 'Database server past EOL date', 'high', 76, [58,60,63,66,70,73,76], 'in-progress', 'DBA Team'),
            ('AST-004', 'Staging', 'Unmanaged IoT device on network', 'high', 82, [65,68,70,73,76,79,82], 'open', 'OT Security'),
            ('AST-005', 'Production', 'Shadow IT SaaS subscription detected', 'medium', 48, [30,32,35,38,42,45,48], 'open', 'GRC Team'),
            ('AST-006', 'Corporate', 'Workstation missing endpoint agent', 'medium', 62, [45,48,50,53,56,59,62], 'mitigated', 'Help Desk'),
        ],
        'roi': [
            ('CMDB Automation Platform', 150000, 120000, 35, 15, 310000),
            ('Endpoint Detection Agent', 80000, 65000, 22, 15, 165000),
            ('Cloud Asset Discovery', 55000, 48000, 18, 14, 125000),
            ('Automated Compliance Tagging', 40000, 35000, 15, 14, 92000),
        ],
        'risk': [
            ('Unknown Asset on Network', 1800000, 0.3, 540000, 75000, 620),
            ('EOL System Exploitation', 2500000, 0.15, 375000, 95000, 295),
            ('Shadow IT Data Leak', 900000, 0.25, 225000, 40000, 463),
        ],
        'apis': [
            ('Asset Discovery', '/api/v1/assets/discover', 'POST', 200, '2m ago'),
            ('CMDB Sync', '/api/v1/assets/sync', 'POST', 200, '15m ago'),
            ('Compliance Check', '/api/v1/assets/compliance', 'GET', 200, '30m ago'),
        ],
        'webhooks': [
            ('New Asset Alert', 'https://hooks.slack.com/T00/B00/ast1', ['asset_discovered'], True, '10m ago'),
            ('EOL Warning', 'https://hooks.slack.com/T00/B00/ast2', ['eol_detected'], True, '1h ago'),
            ('JIRA Auto-Create', 'https://company.atlassian.net/rest/webhooks/2', ['critical_asset'], True, '3h ago'),
        ],
        'ds': [
            ('Active Directory', 'LDAP', 'connected', '5m ago', 4523),
            ('AWS Asset Inventory', 'AWS Config', 'connected', '10m ago', 12890),
            ('Network Scanner DB', 'Nessus', 'connected', '15m ago', 23400),
        ],
        'glossary': [
            ('CMDB', 'Configuration Management Database - centralized asset repository'),
            ('EOL', 'End of Life - date after which vendor no longer provides support'),
            ('Shadow IT', 'IT systems used without organizational approval'),
            ('Asset Criticality', 'Business impact rating assigned to each asset'),
            ('Agent-Based', 'Monitoring approach using software installed on target'),
            ('Agentless', 'Monitoring via network protocols without installed software'),
            ('Fingerprinting', 'Identifying services and OS versions remotely'),
            ('SBOM', 'Software Bill of Materials - inventory of software components'),
            ('ITAM', 'IT Asset Management lifecycle tracking'),
            ('MTD', 'Maximum Tolerable Downtime for business-critical assets'),
            ('RTO', 'Recovery Time Objective - target duration for restoring service'),
            ('Dependency Mapping', 'Visualizing relationships between assets and services'),
        ],
    },
    'sc-phishing-campaign': {
        'domain': 'Phishing Campaign Management',
        'phases': [
            ('Campaign Design', 'completed', 100, 30),
            ('Target List Preparation', 'completed', 100, 20),
            ('Template Configuration', 'completed', 100, 45),
            ('Payload Delivery', 'running', 58, 120),
            ('Response Collection', 'pending', 0, 0),
            ('Analysis and Reporting', 'pending', 0, 0),
            ('Remediation Tracking', 'pending', 0, 0),
        ],
        'jobs': [
            ('Design phishing template', 1, 'done'),
            ('Import target list', 2, 'done'),
            ('Configure landing page', 3, 'processing'),
            ('Schedule email delivery', 2, 'queued'),
            ('Collect click data', 4, 'queued'),
        ],
        'errors': [
            ('Email Delivery Failure', 'net', 15, 'Retry with alternate mail server'),
            ('Template Rendering Issue', 'fs', 3, 'Fix HTML template compatibility'),
            ('Landing Page Down', 'out', 2, 'Restart landing page container'),
            ('Credential Harvest Error', 'hash', 1, 'Check database connection'),
            ('Target Duplicate Found', 'time', 8, 'Deduplicate by email address'),
            ('Spam Filter Blocked', 'scan', 22, 'Rotate sending domain and IP'),
        ],
        'grid_rows': [
            ('PH-001', 'Q2 Campaign', 'Credential harvesting simulation', 'high', 85, [60,65,70,74,78,82,85], 'active', 'Red Team'),
            ('PH-002', 'Q2 Campaign', 'USB drop social engineering test', 'medium', 62, [40,44,48,52,55,58,62], 'active', 'Social Eng'),
            ('PH-003', 'Q1 Campaign', 'Spear phishing C-suite targets', 'critical', 92, [78,80,82,85,88,90,92], 'completed', 'Red Team'),
            ('PH-004', 'Q1 Campaign', 'Vishing voice call simulation', 'medium', 45, [25,28,32,35,38,42,45], 'completed', 'Social Eng'),
            ('PH-005', 'Q2 Campaign', 'SMishing SMS phishing test', 'high', 78, [55,58,62,65,68,72,78], 'active', 'Red Team'),
            ('PH-006', 'Q1 Campaign', 'Business email compromise drill', 'critical', 88, [70,73,76,79,82,85,88], 'completed', 'IR Lead'),
        ],
        'roi': [
            ('Phishing Simulation Platform', 45000, 38000, 25, 15, 98000),
            ('Security Awareness Training', 85000, 65000, 35, 16, 175000),
            ('Email Security Gateway', 120000, 95000, 30, 16, 245000),
            ('SOC Phishing Triage Tool', 55000, 42000, 18, 16, 112000),
        ],
        'risk': [
            ('Successful Phishing Breach', 4200000, 0.2, 840000, 95000, 784),
            ('Credential Compromise', 2800000, 0.35, 980000, 75000, 1207),
            ('Business Email Compromise', 6500000, 0.1, 650000, 110000, 491),
        ],
        'apis': [
            ('Campaign Manager', '/api/v1/phishing/campaigns', 'POST', 200, '5m ago'),
            ('Template Library', '/api/v1/phishing/templates', 'GET', 200, '1h ago'),
            ('Results Analytics', '/api/v1/phishing/results', 'GET', 200, '10m ago'),
        ],
        'webhooks': [
            ('Campaign Complete', 'https://hooks.slack.com/T00/B00/ph1', ['campaign_complete'], True, '2h ago'),
            ('High Click Rate Alert', 'https://hooks.slack.com/T00/B00/ph2', ['high_risk_click'], True, '30m ago'),
            ('Training Assignment', 'https://lms.internal/webhooks/phish', ['assign_training'], False, 'Never'),
        ],
        'ds': [
            ('Employee Directory', 'LDAP', 'connected', '1h ago', 5420),
            ('Email Gateway Logs', 'Exchange', 'connected', '5m ago', 89000),
            ('LMS Training Records', 'SCORM', 'connected', '1h ago', 3210),
        ],
        'glossary': [
            ('Spear Phishing', 'Targeted phishing attack aimed at specific individuals'),
            ('Vishing', 'Voice phishing using phone calls to extract information'),
            ('Smishing', 'SMS-based phishing attacks via text messages'),
            ('BEC', 'Business Email Compromise targeting corporate email accounts'),
            ('Payload', 'Malicious component delivered via phishing email'),
            ('Landing Page', 'Fake website designed to harvest credentials'),
            ('Click Rate', 'Percentage of targets who clicked phishing links'),
            ('Reporting Rate', 'Percentage of targets who reported phishing attempt'),
            ('Pretexting', 'Creating a fabricated scenario to obtain information'),
            ('Watering Hole', 'Attacking websites frequented by target organization'),
            ('Whaling', 'Phishing attack specifically targeting senior executives'),
            ('Dual-Factor Harvesting', 'Stealing both password and 2FA token'),
        ],
    },
    'sc-attack-path-discovery': {
        'domain': 'Attack Path Discovery',
        'phases': [
            ('Network Topology Mapping', 'completed', 100, 60),
            ('Trust Relationship Discovery', 'completed', 100, 90),
            ('Vulnerability Overlay', 'running', 65, 120),
            ('Path Scoring Algorithm', 'pending', 0, 0),
            ('Lateral Movement Analysis', 'pending', 0, 0),
            ('Mitigation Mapping', 'pending', 0, 0),
            ('Path Report Generation', 'pending', 0, 0),
        ],
        'jobs': [
            ('Map internal subnets', 1, 'done'),
            ('Discover trust relationships', 2, 'done'),
            ('Overlay vulnerability data', 3, 'processing'),
            ('Calculate path probabilities', 2, 'queued'),
            ('Generate attack graphs', 4, 'queued'),
        ],
        'errors': [
            ('Subnet Unreachable', 'net', 5, 'Use alternate scan technique'),
            ('Credential Timeout', 'hash', 3, 'Refresh authentication tokens'),
            ('Graph Cycle Detected', 'fs', 2, 'Apply cycle detection and pruning'),
            ('Missing CVE Data', 'time', 8, 'Fetch from NVD database'),
            ('Privilege Escalation Unknown', 'out', 4, 'Flag for manual review'),
            ('Path Explosion', 'scan', 1, 'Limit path depth to 10 hops'),
        ],
        'grid_rows': [
            ('AP-001', 'Internal', 'Web server to domain admin via Kerberoasting', 'critical', 94, [78,82,85,88,90,92,94], 'confirmed', 'Red Team'),
            ('AP-002', 'DMZ to Internal', 'SQL injection to internal database pivot', 'high', 82, [60,64,68,72,75,78,82], 'active', 'Pentest Team'),
            ('AP-003', 'Cloud', 'IAM role chaining to full account takeover', 'critical', 91, [75,78,82,85,87,89,91], 'analyzing', 'Cloud Sec'),
            ('AP-004', 'Internal', 'Pass-the-hash lateral movement path', 'high', 79, [55,58,62,66,70,74,79], 'confirmed', 'IR Team'),
            ('AP-005', 'DMZ', 'WAF bypass to app server RCE', 'high', 85, [68,72,75,78,80,82,85], 'investigating', 'AppSec'),
            ('AP-006', 'Internal', 'Print spooler to domain controller', 'critical', 97, [85,87,89,91,93,95,97], 'confirmed', 'Red Team'),
        ],
        'roi': [
            ('Attack Path Analysis Tool', 95000, 78000, 32, 15, 205000),
            ('Network Segmentation Project', 280000, 195000, 45, 18, 420000),
            ('Privileged Access Management', 180000, 145000, 38, 15, 365000),
            ('Zero Trust Implementation', 450000, 320000, 55, 17, 780000),
        ],
        'risk': [
            ('Domain Admin Compromise', 8000000, 0.08, 640000, 180000, 256),
            ('Lateral Movement to Crown Jewels', 5500000, 0.12, 660000, 150000, 340),
            ('Cloud Account Takeover', 4200000, 0.15, 630000, 95000, 563),
        ],
        'apis': [
            ('Topology Scanner', '/api/v1/attack-path/topology', 'POST', 200, '10m ago'),
            ('Path Calculator', '/api/v1/attack-path/calculate', 'POST', 200, '5m ago'),
            ('Mitigation Engine', '/api/v1/attack-path/mitigate', 'GET', 200, '15m ago'),
        ],
        'webhooks': [
            ('Critical Path Found', 'https://hooks.slack.com/T00/B00/ap1', ['critical_path'], True, '20m ago'),
            ('Path Change Alert', 'https://hooks.slack.com/T00/B00/ap2', ['path_updated'], True, '1h ago'),
            ('JIRA Remediation', 'https://company.atlassian.net/rest/webhooks/3', ['new_path'], True, '2h ago'),
        ],
        'ds': [
            ('Vulnerability Scanner', 'Nessus', 'connected', '30m ago', 45600),
            ('Active Directory', 'LDAP', 'connected', '5m ago', 8900),
            ('Cloud Asset Inventory', 'AWS Config', 'connected', '15m ago', 12300),
        ],
        'glossary': [
            ('Attack Path', 'Sequence of steps an adversary can take to reach an objective'),
            ('Attack Graph', 'Visual representation of possible attack paths in a network'),
            ('Kerberoasting', 'Extracting service account hashes from Kerberos TGS tickets'),
            ('Pass-the-Hash', 'Using captured NTLM hash to authenticate without password'),
            ('Crown Jewels', 'Most valuable assets an attacker would target'),
            ('Blast Radius', 'Scope of impact from a single security failure'),
            ('Pivoting', 'Using a compromised host to access other network segments'),
            ('Lateral Movement', 'Moving through a network after initial compromise'),
            ('Graph Theory', 'Mathematical framework for analyzing network relationships'),
            ('CVSS Score', 'Common Vulnerability Scoring System severity rating'),
            ('Prerequisite Graph', 'Dependencies between exploits for a full attack chain'),
            ('Choke Point', 'Network location where multiple attack paths converge'),
        ],
    },
    'sc-data-flow-tracker': {
        'domain': 'Data Flow Tracking',
        'phases': [
            ('Data Source Identification', 'completed', 100, 45),
            ('Flow Path Discovery', 'completed', 100, 80),
            ('Sensitivity Classification', 'running', 60, 90),
            ('Cross-Boundary Analysis', 'pending', 0, 0),
            ('Compliance Validation', 'pending', 0, 0),
            ('Leak Risk Scoring', 'pending', 0, 0),
            ('Flow Diagram Generation', 'pending', 0, 0),
        ],
        'jobs': [
            ('Identify all data stores', 1, 'done'),
            ('Map API data flows', 2, 'done'),
            ('Classify data sensitivity', 3, 'processing'),
            ('Detect cross-boundary flows', 2, 'queued'),
            ('Score leak risks', 4, 'queued'),
        ],
        'errors': [
            ('Unknown Data Source', 'net', 6, 'Add to inventory and classify'),
            ('Unclassified Data Flow', 'hash', 12, 'Apply ML-based classification'),
            ('Encryption Gap Detected', 'enc', 4, 'Enable TLS on unencrypted flows'),
            ('PII in Transit', 'out', 8, 'Apply field-level encryption'),
            ('Unauthorized Cross-Border', 'scan', 3, 'Block and flag for compliance review'),
            ('Stale Classification', 'time', 5, 'Re-evaluate data sensitivity level'),
        ],
        'grid_rows': [
            ('DF-001', 'Customer DB', 'PII transmitted to analytics service unencrypted', 'critical', 92, [75,78,82,85,88,90,92], 'open', 'Data Eng'),
            ('DF-002', 'Payment Gateway', 'Cardholder data stored in logs beyond retention', 'critical', 95, [82,85,87,89,91,93,95], 'escalated', 'PCI Team'),
            ('DF-003', 'HR System', 'Employee data replicated to backup without encryption', 'high', 78, [58,62,65,68,72,75,78], 'in-progress', 'HR IT'),
            ('DF-004', 'Marketing DB', 'Cross-border data transfer without DPA in place', 'high', 82, [65,68,70,73,76,79,82], 'open', 'Legal'),
            ('DF-005', 'Dev Environment', 'Production data copied to dev without masking', 'medium', 65, [42,46,50,54,58,62,65], 'open', 'DevOps'),
            ('DF-006', 'Cloud Storage', 'Public S3 bucket containing sensitive reports', 'critical', 98, [88,90,92,94,95,97,98], 'mitigated', 'Cloud Sec'),
        ],
        'roi': [
            ('DLP Platform Deployment', 160000, 125000, 30, 16, 320000),
            ('Data Classification Engine', 95000, 78000, 25, 15, 210000),
            ('Encryption Everywhere Initiative', 120000, 92000, 28, 16, 250000),
            ('API Security Gateway', 75000, 62000, 20, 15, 155000),
        ],
        'risk': [
            ('PII Data Breach', 6500000, 0.12, 780000, 150000, 420),
            ('PCI Non-Compliance Fine', 3500000, 0.08, 280000, 85000, 229),
            ('GDPR Penalty', 4200000, 0.05, 210000, 120000, 75),
        ],
        'apis': [
            ('Flow Discovery', '/api/v1/dataflow/discover', 'POST', 200, '10m ago'),
            ('Classification Engine', '/api/v1/dataflow/classify', 'POST', 200, '5m ago'),
            ('Leak Detection', '/api/v1/dataflow/detect', 'GET', 200, '1m ago'),
        ],
        'webhooks': [
            ('PII Leak Alert', 'https://hooks.slack.com/T00/B00/df1', ['pii_detected'], True, '15m ago'),
            ('Cross-Border Transfer', 'https://hooks.slack.com/T00/B00/df2', ['cross_border'], True, '1h ago'),
            ('Compliance Violation', 'https://hooks.slack.com/T00/B00/df3', ['compliance_breach'], True, '30m ago'),
        ],
        'ds': [
            ('Network Flow Logs', 'NetFlow', 'connected', '30s ago', 3450000),
            ('API Gateway Logs', 'Kong', 'connected', '1m ago', 890000),
            ('Database Audit Logs', 'PostgreSQL', 'connected', '5m ago', 234000),
        ],
        'glossary': [
            ('Data Flow Diagram', 'Visual representation of how data moves between systems'),
            ('DLP', 'Data Loss Prevention - technology preventing unauthorized data transfer'),
            ('PII', 'Personally Identifiable Information requiring protection'),
            ('Data Classification', 'Categorizing data by sensitivity level'),
            ('Cross-Boundary Transfer', 'Data movement between security domains or geographies'),
            ('Data-at-Rest', 'Data stored on disk or in databases'),
            ('Data-in-Transit', 'Data actively moving across a network'),
            ('Data-in-Use', 'Data currently being processed in memory'),
            ('Field-Level Encryption', 'Encrypting individual data fields rather than full records'),
            ('Tokenization', 'Replacing sensitive data with non-reversible tokens'),
            ('Data Masking', 'Obscuring data for non-production environments'),
            ('Data Retention Policy', 'Rules governing how long data should be kept'),
        ],
    },
    'sc-vendor-risk-assessment': {
        'domain': 'Vendor Risk Assessment',
        'phases': [
            ('Vendor Inventory Compilation', 'completed', 100, 30),
            ('Risk Questionnaire Dispatch', 'completed', 100, 20),
            ('Response Collection', 'running', 45, 120),
            ('Automated Risk Scoring', 'pending', 0, 0),
            ('Third-Party Data Enrichment', 'pending', 0, 0),
            ('Due Diligence Review', 'pending', 0, 0),
            ('Assessment Report', 'pending', 0, 0),
        ],
        'jobs': [
            ('Import vendor list', 1, 'done'),
            ('Send SOC 2 questionnaires', 2, 'done'),
            ('Collect responses', 3, 'processing'),
            ('Enrich with financial data', 2, 'queued'),
            ('Calculate risk scores', 4, 'queued'),
        ],
        'errors': [
            ('Questionnaire Overdue', 'time', 8, 'Send reminder and escalate to vendor PM'),
            ('SOC 2 Report Expired', 'hash', 5, 'Request updated SOC 2 Type II report'),
            ('Incomplete Response', 'fs', 12, 'Flag missing sections for follow-up'),
            ('Financial Instability Flag', 'out', 3, 'Review with legal and procurement'),
            ('Sub-Processor Unknown', 'scan', 6, 'Request full sub-processor disclosure'),
            ('Contract Clause Missing', 'enc', 4, 'Flag for legal review and amendment'),
        ],
        'grid_rows': [
            ('VR-001', 'Tier 1', 'Cloud hosting provider SOC 2 gap', 'high', 78, [60,63,66,70,73,76,78], 'in-review', 'GRC Team'),
            ('VR-002', 'Tier 2', 'Payment processor PCI compliance expired', 'critical', 92, [78,80,82,85,88,90,92], 'escalated', 'PCI Lead'),
            ('VR-003', 'Tier 1', 'SaaS vendor with data residency concern', 'high', 82, [62,65,68,72,75,78,82], 'open', 'Privacy Team'),
            ('VR-004', 'Tier 3', 'Marketing tool with excessive permissions', 'medium', 55, [35,38,42,45,48,52,55], 'in-review', 'IT Admin'),
            ('VR-005', 'Tier 2', 'HR system vendor financial instability', 'high', 85, [68,72,75,78,80,82,85], 'open', 'Procurement'),
            ('VR-006', 'Tier 1', 'CDN provider incident response gap', 'medium', 62, [45,48,52,55,58,60,62], 'mitigated', 'Infra Lead'),
        ],
        'roi': [
            ('TPRM Platform License', 95000, 78000, 28, 15, 205000),
            ('Continuous Monitoring Service', 65000, 55000, 22, 15, 140000),
            ('Automated Questionnaire System', 45000, 38000, 18, 15, 95000),
            ('Vendor Onboarding Automation', 55000, 42000, 20, 16, 110000),
        ],
        'risk': [
            ('Vendor Data Breach', 4800000, 0.1, 480000, 120000, 300),
            ('Service Disruption', 2200000, 0.15, 330000, 65000, 408),
            ('Regulatory Fine via Vendor', 3500000, 0.06, 210000, 85000, 147),
        ],
        'apis': [
            ('Vendor Registry', '/api/v1/vendors', 'GET', 200, '5m ago'),
            ('Risk Scorer', '/api/v1/vendors/score', 'POST', 200, '15m ago'),
            ('Questionnaire Engine', '/api/v1/vendors/questionnaire', 'POST', 200, '30m ago'),
        ],
        'webhooks': [
            ('High Risk Vendor Alert', 'https://hooks.slack.com/T00/B00/vr1', ['high_risk_vendor'], True, '1h ago'),
            ('Assessment Due', 'https://hooks.slack.com/T00/B00/vr2', ['assessment_due'], True, '6h ago'),
            ('SOC 2 Expiry Warning', 'https://hooks.slack.com/T00/B00/vr3', ['cert_expiry'], True, '1d ago'),
        ],
        'ds': [
            ('Vendor Database', 'PostgreSQL', 'connected', '5m ago', 342),
            ('Financial Data Feed', 'Bloomberg', 'connected', '1h ago', 342),
            ('Threat Intelligence', 'Recorded Future', 'connected', '30m ago', 156),
        ],
        'glossary': [
            ('TPRM', 'Third-Party Risk Management lifecycle for vendor oversight'),
            ('SOC 2', 'Service Organization Control audit report for service providers'),
            ('DPA', 'Data Processing Agreement governing data handling by vendors'),
            ('Tier Classification', 'Risk-based categorization of vendor criticality'),
            ('Sub-Processor', 'Third party that a vendor uses to process data'),
            ('Due Diligence', 'Comprehensive investigation before engaging a vendor'),
            ('Right to Audit', 'Contractual right to inspect vendor security practices'),
            ('NDA', 'Non-Disclosure Agreement protecting shared confidential data'),
            ('MSA', 'Master Service Agreement defining vendor relationship terms'),
            ('BAA', 'Business Associate Agreement for HIPAA-covered data sharing'),
            ('Residual Risk', 'Risk remaining after controls and mitigations applied'),
            ('Fourth Party', 'Sub-contractor or sub-processor used by a vendor'),
        ],
    },
    'sc-privilege-escalation': {
        'domain': 'Privilege Escalation Analysis',
        'phases': [
            ('Current Privilege Audit', 'completed', 100, 45),
            ('Vector Identification', 'completed', 100, 60),
            ('Exploit Feasibility Check', 'running', 55, 90),
            ('Impact Assessment', 'pending', 0, 0),
            ('Remediation Planning', 'pending', 0, 0),
            ('Verification Testing', 'pending', 0, 0),
            ('Escalation Report', 'pending', 0, 0),
        ],
        'jobs': [
            ('Enumerate local admin accounts', 1, 'done'),
            ('Check token privileges', 2, 'done'),
            ('Test named pipe impersonation', 3, 'processing'),
            ('Verify UAC bypass vectors', 2, 'queued'),
            ('Assess service account risks', 4, 'queued'),
        ],
        'errors': [
            ('Access Denied on Target', 'enc', 4, 'Request elevated credentials for scan'),
            ('AV Detection Interference', 'scan', 3, 'Exclude scanner from AV rules'),
            ('Token Handle Invalid', 'hash', 2, 'Refresh token and retry operation'),
            ('Service Account Locked', 'time', 1, 'Unlock account via AD admin'),
            ('Kernel Driver Blocked', 'out', 5, 'Load test-signed driver in debug mode'),
            ('Race Condition Failure', 'fs', 2, 'Retry with timing adjustment'),
        ],
        'grid_rows': [
            ('PE-001', 'Windows', 'Named pipe impersonation to SYSTEM', 'critical', 94, [78,82,85,88,90,92,94], 'confirmed', 'Red Team'),
            ('PE-002', 'Linux', 'SUID binary exploitation path', 'high', 82, [62,66,70,74,77,80,82], 'active', 'Pentest'),
            ('PE-003', 'Windows', 'Kerberos ticket extraction from memory', 'critical', 91, [72,75,78,82,85,88,91], 'confirmed', 'Red Team'),
            ('PE-004', 'Cloud', 'IAM role assumption chain', 'high', 85, [68,72,75,78,80,82,85], 'investigating', 'Cloud Sec'),
            ('PE-005', 'Windows', 'UAC bypass via COM hijacking', 'high', 79, [58,62,66,70,74,77,79], 'active', 'Red Team'),
            ('PE-006', 'Linux', 'Docker socket access to host root', 'critical', 96, [82,85,88,91,93,95,96], 'confirmed', 'Container Sec'),
        ],
        'roi': [
            ('PAM Solution Deployment', 180000, 145000, 40, 15, 380000),
            ('Least-Privilege Automation', 95000, 78000, 28, 15, 210000),
            ('Service Account Management', 65000, 52000, 22, 15, 135000),
            ('Session Recording Platform', 120000, 95000, 30, 16, 250000),
        ],
        'risk': [
            ('Domain Admin Compromise', 8500000, 0.08, 680000, 180000, 278),
            ('Privileged Account Abuse', 3200000, 0.2, 640000, 95000, 574),
            ('Container Escape to Host', 4500000, 0.1, 450000, 120000, 275),
        ],
        'apis': [
            ('Privilege Scanner', '/api/v1/privesc/scan', 'POST', 200, '5m ago'),
            ('Vector Database', '/api/v1/privesc/vectors', 'GET', 200, '15m ago'),
            ('Remediation Engine', '/api/v1/privesc/remediate', 'POST', 200, '30m ago'),
        ],
        'webhooks': [
            ('New Escalation Vector', 'https://hooks.slack.com/T00/B00/pe1', ['new_vector'], True, '10m ago'),
            ('Privilege Abuse Alert', 'https://hooks.slack.com/T00/B00/pe2', ['abuse_detected'], True, '5m ago'),
            ('JIRA Ticket Create', 'https://company.atlassian.net/rest/webhooks/4', ['critical_vector'], True, '1h ago'),
        ],
        'ds': [
            ('Active Directory', 'LDAP', 'connected', '2m ago', 15200),
            ('Linux Server Inventory', 'Ansible', 'connected', '10m ago', 4500),
            ('Container Registry', 'Kubernetes', 'connected', '5m ago', 890),
        ],
        'glossary': [
            ('PAM', 'Privileged Access Management for controlling admin accounts'),
            ('UAC', 'User Account Control - Windows feature preventing unauthorized changes'),
            ('Kerberoasting', 'Extracting service account hashes via Kerberos TGS requests'),
            ('Named Pipe Impersonation', 'Using named pipes to impersonate connected clients'),
            ('SUID Binary', 'Linux executable that runs with file owner permissions'),
            ('Token Impersonation', 'Using another users security token to gain their access'),
            ('Pass-the-Hash', 'Authenticating with NTLM hash instead of password'),
            ('Golden Ticket', 'Forged Kerberos TGT granting arbitrary domain access'),
            ('Silver Ticket', 'Forged Kerberos service ticket for specific service access'),
            ('Docker Escape', 'Breaking out of a container to access the host system'),
            ('Just Enough Admin', 'Granting minimum privileges for specific tasks only'),
            ('Standing Privilege', 'Always-active admin access vs. just-in-time elevation'),
        ],
    },
}

# Process all panels
for panel_name, cfg in PANELS.items():
    filepath = os.path.join(PANELS_DIR, panel_name + '.ts')
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} not found")
        continue
    
    with open(filepath, 'r') as f:
        current_lines = f.read().count('\n') + 1
    
    if current_lines >= 1500:
        print(f"SKIP: {panel_name} already at {current_lines} lines")
        continue
    
    print(f"Enhancing {panel_name} ({current_lines} -> ...):")
    content = generate_enhancement(
        domain=cfg['domain'],
        phases=cfg['phases'],
        jobs=cfg['jobs'],
        errors=cfg['errors'],
        grid_rows=cfg['grid_rows'],
        roi=cfg['roi'],
        risk=cfg['risk'],
        apis=cfg['apis'],
        webhooks=cfg['webhooks'],
        data_sources=cfg['ds'],
        glossary=cfg['glossary'],
    )
    enhance_file(filepath, content)

print("\nBatch complete.")
