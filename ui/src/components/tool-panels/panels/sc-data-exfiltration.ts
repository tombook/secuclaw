/**
 * sc-data-exfiltration.ts - Advanced Data Exfiltration Analyzer (Security Ops Dark Capability)
 * Data source enumeration, exfiltration method profiling, bandwidth simulation,
 * detection probability scoring, timeline analysis, mitigation recommendations,
 * history tracking, and comprehensive report generation
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type ExfilMethod = 'dns-tunneling' | 'https-encrypted' | 'icmp' | 'steganography' | 'cloud-storage' | 'email' | 'usb' | 'bluetooth' | 'ftp' | 'covert-channel' | 'print-job' | 'audio-channel';
type DataSource = 'database' | 'file-server' | 'cloud-storage' | 'email-archive' | 'source-code' | 'credentials' | 'piii-data' | 'financial-data' | 'intellectual-property' | 'customer-data';
type DetectionLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ExfilConfig {
  source: DataSource; method: ExfilMethod; volume: number; speed: string;
  encryption: string; chunkSize: number; protocol: string; obfuscation: boolean;
  scheduling: string; duration: number; compression: boolean; encoding: string;
  jitter: boolean; splitSize: number; targetRegion: string;
}

interface MethodProfile {
  method: ExfilMethod; baseProb: number; factors: string[]; mitigation: string;
  bandwidth: string; maxVolume: string; stealth: number; complexity: string;
  detectabilityByTool: { tool: string; detectable: boolean; confidence: number }[];
  indicators: { name: string; description: string; severity: DetectionLevel }[];
}

interface DetectionResult {
  method: string; probability: number; factors: string[]; mitigation: string;
  confidence: number; bandwidthImpact: string; stealthScore: number;
}

interface TimeSlotData {
  hour: number; activity: number; method: string; volume: number; risk: number;
}

interface ExfilExecution {
  id: string; config: ExfilConfig; startedAt: string; completedAt: string;
  results: DetectionResult[]; timeline: TimeSlotData[];
  totalRisk: number; status: 'complete' | 'error';
}

interface DLPControl {
  name: string; enabled: boolean; coverage: string; effectiveness: number;
  gapDescription: string;
}

const METHOD_PROFILES: Record<ExfilMethod, MethodProfile}> = {
  'dns-tunneling': {
    method: 'dns-tunneling', baseProb: 35,
    factors: ['Unusual DNS query volume (>1000/min)', 'Subdomain entropy analysis exceeds threshold', 'TXT record size anomalies (large responses)', 'Query pattern frequency shows beaconing', 'Unusual TLD usage patterns', 'DNS over HTTPS to suspicious resolvers'],
    mitigation: 'Deploy DNS monitoring (Zeek/Suricata), implement entropy-based detection, block DNS to unauthorized resolvers, rate-limit DNS queries per endpoint, monitor TXT record sizes',
    bandwidth: '50-100 KB/s', maxVolume: '5 GB/day', stealth: 7, complexity: 'medium',
    detectabilityByTool: [
      { tool: 'Zeek/Bro', detectable: true, confidence: 75 },
      { tool: 'Suricata', detectable: true, confidence: 70 },
      { tool: 'Wireshark', detectable: true, confidence: 80 },
      { tool: 'Splunk DNS App', detectable: true, confidence: 85 },
      { tool: 'Standard IDS', detectable: false, confidence: 20 },
    ],
    indicators: [
      { name: 'High DNS query rate', description: 'Endpoint generating >1000 DNS queries per minute to unusual domains', severity: 'high' },
      { name: 'Large DNS responses', description: 'TXT record responses exceeding 512 bytes', severity: 'medium' },
      { name: 'DGA domain patterns', description: 'Domain names with high entropy characteristic of DGA algorithms', severity: 'high' },
      { name: 'Unusual record types', description: 'Excessive AAAA, TXT, or NULL record queries', severity: 'medium' },
    ],
  },
  'https-encrypted': {
    method: 'https-encrypted', baseProb: 15,
    factors: ['TLS certificate pinning bypass attempts', 'Unusual outbound HTTPS traffic volume spikes', 'Beaconing patterns in TLS connections', 'Data size anomalies in HTTPS payloads', 'JA3/JA3S fingerprint anomalies', 'SNI-based detection of suspicious domains'],
    mitigation: 'Deploy TLS inspection (MITM proxy), monitor egress traffic baselines, implement JA3 fingerprinting, use certificate transparency logs, deploy DLP on egress',
    bandwidth: '1-10 MB/s', maxVolume: '500 GB/day', stealth: 9, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Zeek SSL logs', detectable: true, confidence: 50 },
      { tool: 'TLS Inspection Proxy', detectable: true, confidence: 85 },
      { tool: 'NetFlow/PCAP', detectable: true, confidence: 40 },
      { tool: 'Standard IDS', detectable: false, confidence: 15 },
    ],
    indicators: [
      { name: 'Volume anomaly', description: 'HTTPS upload volume significantly above baseline for endpoint', severity: 'medium' },
      { name: 'Beaconing pattern', description: 'Regular TLS connection intervals suggesting C2 communication', severity: 'high' },
      { name: 'Unknown SNI', description: 'TLS connections to domains not in organization whitelist', severity: 'medium' },
    ],
  },
  'icmp': {
    method: 'icmp', baseProb: 40,
    factors: ['ICMP tunnel payload size anomalies', 'Frequency anomalies (>100 pings/min)', 'Unusual ICMP type usage (type 13/17)', 'Ping flood patterns from single endpoint', 'ICMP redirect messages', 'Fragmented ICMP packets'],
    mitigation: 'Block ICMP at perimeter firewall, monitor ICMP payload sizes (max 64 bytes), rate limit ICMP per endpoint, alert on unusual ICMP types, deploy host-based ICMP monitoring',
    bandwidth: '10-50 KB/s', maxVolume: '2 GB/day', stealth: 5, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Suricata', detectable: true, confidence: 80 },
      { tool: 'Zeek', detectable: true, confidence: 75 },
      { tool: 'Firewall logs', detectable: true, confidence: 60 },
      { tool: 'Wireshark', detectable: true, confidence: 90 },
    ],
    indicators: [
      { name: 'Large ICMP payloads', description: 'ICMP echo request/reply exceeding standard MTU', severity: 'high' },
      { name: 'High ICMP frequency', description: 'Endpoint sending ICMP at rates exceeding normal operations', severity: 'high' },
      { name: 'Unusual ICMP types', description: 'Timestamp, address mask, or information request types', severity: 'critical' },
    ],
  },
  'steganography': {
    method: 'steganography', baseProb: 5,
    factors: ['File size anomalies for media types', 'Entropy analysis shows near-random data in images', 'Unusual image download patterns', 'Metadata analysis reveals tampering', 'Color channel distribution anomalies', 'Lack of EXIF data on camera images'],
    mitigation: 'Implement file integrity monitoring, deploy steganalysis tools, analyze file entropy distributions, monitor image upload volumes, strip metadata from uploaded files',
    bandwidth: '100-500 KB/s', maxVolume: '20 GB/day', stealth: 10, complexity: 'high',
    detectabilityByTool: [
      { tool: 'Stegdetect', detectable: true, confidence: 65 },
      { tool: 'Entropy analysis', detectable: true, confidence: 55 },
      { tool: 'Standard IDS', detectable: false, confidence: 5 },
      { tool: 'DLP endpoint', detectable: false, confidence: 10 },
    ],
    indicators: [
      { name: 'High entropy images', description: 'PNG/JPEG files with entropy values >7.5 suggesting embedded data', severity: 'medium' },
      { name: 'Unusual image uploads', description: 'Endpoint uploading significantly more images than normal', severity: 'low' },
    ],
  },
  'cloud-storage': {
    method: 'cloud-storage', baseProb: 25,
    factors: ['Cloud API usage anomalies (unusual endpoints)', 'Upload volume spikes to cloud services', 'Unusual cloud service access from corporate endpoints', 'API key usage patterns outside normal hours', 'New cloud storage account creation', 'Large file uploads to personal cloud accounts'],
    mitigation: 'Deploy CASB (Cloud Access Security Broker), monitor cloud API usage patterns, restrict cloud storage to approved services, implement API key management, block personal cloud storage',
    bandwidth: '5-50 MB/s', maxVolume: '100 GB/day', stealth: 7, complexity: 'low',
    detectabilityByTool: [
      { tool: 'CASB', detectable: true, confidence: 85 },
      { tool: 'Proxy logs', detectable: true, confidence: 70 },
      { tool: 'Cloud provider audit logs', detectable: true, confidence: 90 },
      { tool: 'DLP endpoint', detectable: true, confidence: 60 },
    ],
    indicators: [
      { name: 'Upload spike', description: 'Sudden increase in upload volume to cloud storage services', severity: 'medium' },
      { name: 'Unauthorized cloud service', description: 'Access to non-approved cloud storage from corporate device', severity: 'high' },
      { name: 'After-hours upload', description: 'Large data transfers to cloud services outside business hours', severity: 'medium' },
    ],
  },
  'email': {
    method: 'email', baseProb: 30,
    factors: ['Attachment size anomalies exceeding policy limits', 'Unusual email recipients (external personal addresses)', 'Off-hours email activity with attachments', 'Encrypted archive attachments (ZIP, RAR, 7z)', 'High volume of forwarded emails', 'Email content matching DLP rules'],
    mitigation: 'Deploy DLP for email, scan all attachments with sandbox, monitor outbound email volume per user, restrict encrypted archive attachments, implement mail gateway DLP policies',
    bandwidth: '100 KB-5 MB/s', maxVolume: '50 GB/day', stealth: 6, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Email DLP', detectable: true, confidence: 80 },
      { tool: 'Email gateway logs', detectable: true, confidence: 75 },
      { tool: 'Sandbox analysis', detectable: true, confidence: 70 },
      { tool: 'SIEM correlation', detectable: true, confidence: 65 },
    ],
    indicators: [
      { name: 'Large attachments', description: 'Email attachments exceeding typical size for organization', severity: 'medium' },
      { name: 'External recipients', description: 'Emails with sensitive content sent to external addresses', severity: 'high' },
      { name: 'Encrypted archives', description: 'Password-protected ZIP or RAR attachments', severity: 'high' },
    ],
  },
  'usb': {
    method: 'usb', baseProb: 20,
    factors: ['USB device insertion events', 'Large file copy operations to removable media', 'Removable media policy violations', 'USB mass storage activity after hours', 'Autorun/autoplay execution from USB', 'USB storage write speed anomalies'],
    mitigation: 'Implement USB device control (whitelist authorized devices), deploy endpoint DLP, monitor file copy operations, disable autorun, log all USB events, encrypt removable media',
    bandwidth: '10-100 MB/s', maxVolume: '500 GB/day', stealth: 3, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Endpoint DLP', detectable: true, confidence: 90 },
      { tool: 'USB monitoring agent', detectable: true, confidence: 95 },
      { tool: 'Windows Event logs', detectable: true, confidence: 80 },
      { tool: 'Network monitoring', detectable: false, confidence: 10 },
    ],
    indicators: [
      { name: 'USB insertion', description: 'Unauthorized USB mass storage device connected', severity: 'high' },
      { name: 'Large file copy', description: 'Bulk file operations to removable storage', severity: 'high' },
      { name: 'After-hours USB', description: 'USB activity outside normal business hours', severity: 'medium' },
    ],
  },
  'bluetooth': {
    method: 'bluetooth', baseProb: 10,
    factors: ['Bluetooth pairing events with unknown devices', 'Device discovery scans', 'OBEX file transfer protocol activity', 'Range anomalies suggesting bridge devices', 'Bluetooth tethering activation'],
    mitigation: 'Disable Bluetooth on sensitive systems, deploy Bluetooth monitoring, implement device pairing policies, monitor BT file transfer logs, use physical security controls',
    bandwidth: '50-500 KB/s', maxVolume: '5 GB/day', stealth: 6, complexity: 'medium',
    detectabilityByTool: [
      { tool: 'Bluetooth monitoring', detectable: true, confidence: 70 },
      { tool: 'Endpoint agent', detectable: true, confidence: 60 },
      { tool: 'Network monitoring', detectable: false, confidence: 5 },
    ],
    indicators: [
      { name: 'Unknown pairing', description: 'Bluetooth pairing with unrecognized device', severity: 'medium' },
      { name: 'File transfer', description: 'OBEX file transfer detected', severity: 'high' },
    ],
  },
  'ftp': {
    method: 'ftp', baseProb: 45,
    factors: ['FTP/FTPS connection to external servers', 'Large file uploads via FTP', 'FTP login attempts with stolen credentials', 'FTP bounce attacks', 'Unusual FTP command sequences'],
    mitigation: 'Block outbound FTP at firewall, require SFTP/SCP instead, monitor FTP logs, implement file transfer policies, deploy DLP on FTP traffic',
    bandwidth: '5-50 MB/s', maxVolume: '200 GB/day', stealth: 2, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Firewall logs', detectable: true, confidence: 85 },
      { tool: 'FTP server logs', detectable: true, confidence: 90 },
      { tool: 'Network IDS', detectable: true, confidence: 75 },
    ],
    indicators: [
      { name: 'External FTP', description: 'FTP connection to non-authorized external server', severity: 'high' },
      { name: 'Large upload', description: 'Significant data upload via FTP protocol', severity: 'high' },
    ],
  },
  'covert-channel': {
    method: 'covert-channel', baseProb: 8,
    factors: ['Unusual protocol header manipulation', 'Timing channel patterns', 'Packet size manipulation', 'Unused protocol fields carrying data', 'Protocol steganography'],
    mitigation: 'Deploy deep packet inspection, normalize network traffic, monitor for protocol anomalies, implement traffic analysis, use network flow analysis',
    bandwidth: '10-100 KB/s', maxVolume: '5 GB/day', stealth: 10, complexity: 'expert',
    detectabilityByTool: [
      { tool: 'Deep packet inspection', detectable: true, confidence: 40 },
      { tool: 'Network flow analysis', detectable: true, confidence: 35 },
      { tool: 'Standard IDS', detectable: false, confidence: 10 },
    ],
    indicators: [
      { name: 'Protocol anomaly', description: 'Network traffic showing unusual protocol header patterns', severity: 'medium' },
      { name: 'Timing channel', description: 'Regular packet timing intervals suggesting covert communication', severity: 'low' },
    ],
  },
  'print-job': {
    method: 'print-job', baseProb: 12,
    factors: ['Unusual print job sizes', 'Print jobs to non-existent or unauthorized printers', 'High volume print spool activity', 'Print jobs containing sensitive keywords', 'QR code or encoded data in print jobs'],
    mitigation: 'Monitor print job sizes and destinations, implement secure print release, audit print spooler activity, deploy print monitoring tools, restrict print to authorized printers',
    bandwidth: '1-10 MB/s', maxVolume: '20 GB/day', stealth: 4, complexity: 'low',
    detectabilityByTool: [
      { tool: 'Print server logs', detectable: true, confidence: 80 },
      { tool: 'Endpoint monitoring', detectable: true, confidence: 70 },
    ],
    indicators: [
      { name: 'Large print job', description: 'Print job exceeding normal size threshold', severity: 'medium' },
      { name: 'Unauthorized printer', description: 'Print job sent to non-standard or external print destination', severity: 'high' },
    ],
  },
  'audio-channel': {
    method: 'audio-channel', baseProb: 3,
    factors: ['Ultrasonic audio transmission', 'Microphone activation anomalies', 'Audio file metadata anomalies', 'Frequency spectrum analysis shows data patterns', 'Unusual audio codec usage'],
    mitigation: 'Disable microphones on sensitive systems, deploy audio monitoring, analyze audio frequency spectrums, restrict audio recording capabilities',
    bandwidth: '1-50 KB/s', maxVolume: '1 GB/day', stealth: 9, complexity: 'expert',
    detectabilityByTool: [
      { tool: 'Audio spectrum analysis', detectable: true, confidence: 45 },
      { tool: 'Standard monitoring', detectable: false, confidence: 5 },
    ],
    indicators: [
      { name: 'Ultrasonic signal', description: 'Audio output containing ultrasonic frequency data patterns', severity: 'low' },
      { name: 'Microphone anomaly', description: 'Microphone activation during non-call periods', severity: 'medium' },
    ],
  },
};

const DLP_CONTROLS: DLPControl[] = [
  { name: 'Network DLP (Egress)', enabled: true, coverage: 'All outbound network traffic', effectiveness: 75, gapDescription: 'Cannot inspect TLS-encrypted traffic without proxy' },
  { name: 'Endpoint DLP', enabled: true, coverage: 'All managed endpoints', effectiveness: 85, gapDescription: 'Unmanaged devices and BYOD not covered' },
  { name: 'Email DLP Gateway', enabled: true, coverage: 'All outbound email', effectiveness: 80, gapDescription: 'Webmail and personal email bypass' },
  { name: 'Cloud DLP (CASB)', enabled: false, coverage: 'Approved cloud services only', effectiveness: 0, gapDescription: 'Not deployed - no cloud visibility' },
  { name: 'USB Device Control', enabled: true, coverage: 'Managed endpoints', effectiveness: 90, gapDescription: 'Linux and embedded systems not managed' },
  { name: 'Database Activity Monitoring', enabled: false, coverage: 'Not deployed', effectiveness: 0, gapDescription: 'No database access monitoring' },
  { name: 'Network Flow Analysis', enabled: true, coverage: 'Internal and external flows', effectiveness: 60, gapDescription: 'Cannot identify data content in encrypted flows' },
];

@customElement('sc-data-exfiltration')
export class ScDataExfiltration extends LitElement {
  @property({ type: String }) panelId = 'data-exfiltration';
  @state() private _config: ExfilConfig = {
    source: 'database', method: 'https-encrypted', volume: 500, speed: '1MB/s',
    encryption: 'AES-256', chunkSize: 1024, protocol: 'TLS 1.3', obfuscation: true,
    scheduling: 'off-hours', duration: 60, compression: true, encoding: 'base64',
    jitter: true, splitSize: 0, targetRegion: 'eu-west',
  };
  @state() private _results: DetectionResult[] = [];
  @state() private _timeline: TimeSlotData[] = [];
  @state() private _analyzed = false;
  @state() private _activeTab: 'config' | 'analysis' | 'timeline' | 'dlp' | 'history' = 'config';
  @state() private _expandedMethod: string | null = null;
  @state() private _history: ExfilExecution[] = [];
  @state() private _progress = 0;
  // Enhanced features
  @state() private _auditTrail: Array<{id:string;timestamp:string;action:string;user:string;details:string;category:string}> = [];
  @state() private _auditFilter = 'all';
  @state() private _execHistory: Array<{id:string;timestamp:string;itemsScanned:number;findings:number;criticalCount:number;duration:number;status:string}> = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _settingsTab: string = 'general';
  @state() private _autoInterval = 24;
  @state() private _criticalThreshold = 3;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _slaTargetHours = 72;
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _showEnhanced = false;


  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus { border-color: #3b82f6; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .result-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid; cursor: pointer; transition: all 0.2s; }
    .result-high { border-left-color: #dc2626; }
    .result-medium { border-left-color: #f59e0b; }
    .result-low { border-left-color: #3b82f6; }
    .result-name { font-weight: 600; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .prob-bar { height: 8px; background: #0f1117; border-radius: 4px; margin: 8px 0; overflow: hidden; }
    .prob-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .factor-list { font-size: 12px; }
    .factor-item { padding: 3px 0; color: #d1d5db; }
    .indicator-item { display: flex; align-items: flex-start; gap: 6px; padding: 4px 0; font-size: 12px; }
    .indicator-name { font-weight: 600; min-width: 120px; }
    .indicator-sev { font-size: 10px; padding: 2px 6px; border-radius: 4px; }
    .sev-high { background: #3a1e1e; color: #f87171; }
    .sev-medium { background: #3a3a1e; color: #fbbf24; }
    .sev-low { background: #1e3a2f; color: #34d399; }
    .sev-critical { background: #3a1e1e; color: #dc2626; }
    .tool-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
    .tool-name { min-width: 120px; font-weight: 600; }
    .tool-bar { flex: 1; height: 6px; background: #0f1117; border-radius: 3px; overflow: hidden; }
    .tool-fill { height: 100%; border-radius: 3px; }
    .timeline-bar { display: flex; gap: 2px; height: 140px; align-items: flex-end; margin: 16px 0; }
    .timeline-block { flex: 1; border-radius: 2px 2px 0 0; min-width: 8px; position: relative; transition: height 0.3s; cursor: pointer; }
    .timeline-label { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 9px; color: #6b7280; white-space: nowrap; }
    .timeline-tooltip { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px; font-size: 10px; white-space: nowrap; z-index: 10; pointer-events: none; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .dlp-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; }
    .dlp-status { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .dlp-status.on { background: #34d399; }
    .dlp-status.off { background: #f87171; }
    .dlp-info { flex: 1; }
    .dlp-name { font-weight: 600; font-size: 13px; }
    .dlp-coverage { font-size: 11px; color: #9ca3af; }
    .dlp-gap { font-size: 11px; color: #fbbf24; margin-top: 2px; }
    .dlp-effectiveness { width: 60px; text-align: center; }
    .detail-panel { background: #0f1117; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; margin-top: 8px; }
    .detail-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; }
    .history-item { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 10px; margin-bottom: 6px; cursor: pointer; }
    .history-item:hover { border-color: #3b82f6; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  private _analyze(): void {
    const c = this._config;
    const results: DetectionResult[] = [];
    const profile = METHOD_PROFILES[c.method];

    let prob = profile.baseProb;
    if (c.obfuscation) prob *= 0.65;
    if (c.compression) prob *= 0.85;
    if (c.scheduling === 'off-hours') prob *= 0.8;
    if (c.scheduling === 'random') prob *= 0.75;
    if (c.jitter) prob *= 0.8;
    if (c.encoding !== 'plaintext') prob *= 0.9;
    if (c.volume > 1000) prob *= 1.15;
    if (c.encryption === 'AES-256') prob *= 0.9;
    if (c.encryption === 'none') prob *= 1.3;
    if (c.splitSize > 0) prob *= 0.85;

    results.push({
      method: c.method.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      probability: Math.round(prob), factors: profile.factors, mitigation: profile.mitigation,
      confidence: 85, bandwidthImpact: profile.bandwidth, stealthScore: profile.stealth,
    });

    const altMethods: ExfilMethod[] = ['dns-tunneling', 'https-encrypted', 'icmp', 'cloud-storage', 'email', 'ftp'];
    altMethods.filter(m => m !== c.method).slice(0, 4).forEach(am => {
      const alt = METHOD_PROFILES[am];
      results.push({
        method: am.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        probability: Math.round(alt.baseProb * (0.8 + Math.random() * 0.4)),
        factors: alt.factors.slice(0, 3), mitigation: alt.mitigation,
        confidence: Math.round(60 + Math.random() * 25), bandwidthImpact: alt.bandwidth,
        stealthScore: alt.stealth,
      });
    });

    this._results = results.sort((a, b) => b.probability - a.probability);
    this._analyzed = true;
    this._activeTab = 'analysis';

    const timeline: TimeSlotData[] = Array.from({ length: 24 }, (_, i) => {
      let activity: number;
      const isOffHours = c.scheduling === 'off-hours' ? (i < 6 || i > 20) : c.scheduling === 'random' ? Math.random() > 0.5 : true;
      if (c.scheduling === 'off-hours') {
        activity = isOffHours ? 60 + Math.random() * 40 : Math.random() * 15;
      } else if (c.scheduling === 'random') {
        activity = Math.random() > 0.3 ? 30 + Math.random() * 70 : Math.random() * 10;
      } else {
        activity = 50 + Math.random() * 50;
      }
      if (c.jitter) activity *= 0.5 + Math.random();
      return { hour: i, activity: Math.round(activity), method: c.method, volume: Math.round(activity * c.volume / 24), risk: Math.round(activity) };
    });
    this._timeline = timeline;

    this._history = [{
      id: 'EX-' + Date.now().toString(36).toUpperCase(),
      config: { ...c }, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(),
      results: [...results], timeline: [...timeline],
      totalRisk: Math.round(prob), status: 'complete',
    }, ...this._history].slice(0, 20);
  }

  private _exportReport(): void {
    const data = { config: this._config, results: this._results, timeline: this._timeline, dlpControls: DLP_CONTROLS };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `exfil-analysis-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  private _addAudit(category: string, details: string): void {
    this._auditTrail = [{ id: 'a-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _runScanWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('scan', 'Starting analysis');
    const record: any = { id: 'ex-' + Date.now(), timestamp: new Date().toISOString(), itemsScanned: 0, findings: 0, criticalCount: 0, duration: 0, status: 'running' };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.itemsScanned = this._results.length;
        record.findings = this._results.filter((x: any) => x.severity && x.severity !== 'low').length;
        record.criticalCount = this._results.filter((x: any) => x.severity === 'critical').length;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('scan', 'Scan completed: ' + record.findings + ' findings');
      }
    }, 200);
  }

  private _renderAuditPanel(): any {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter((e: any) => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'scan', 'review', 'config', 'export'].map((f: string) => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.map((e: any) => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
          <div style="flex:1"><div style="color:#e2e8f0;font-weight:500">${e.details}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div></div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderExecHistory(): any {
    if (this._execHistory.length === 0) return html`<div class="empty-state"><div>No scan history</div></div>`;
    const sorted = [...this._execHistory].sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5/page</option><option value="10">10/page</option><option value="25">25/page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Items</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Findings</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th></tr></thead>
        <tbody>${records.map((r: any) => html`<tr style="border-bottom:1px solid #1f2937">
          <td style="padding:7px 8px;font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
          <td style="padding:7px 8px">${r.itemsScanned}</td>
          <td style="padding:7px 8px;color:#f59e0b;font-weight:700">${r.findings}</td>
          <td style="padding:7px 8px">${r.duration}s</td>
          <td style="padding:7px 8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:${r.status === 'success' ? '#22c55e20' : '#ef444420'};color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status}</span></td>
        </tr>`)}</tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_: any, i: number) => html`<button class="btn btn-sm ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderSettingsPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Settings</div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        ${['general', 'thresholds', 'integrations'].map((t: string) => html`<button class="btn btn-sm ${this._settingsTab === t ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = t; }}>${t}</button>`)}
      </div>
      ${this._settingsTab === 'general' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._results.forEach((item: any) => { const r = item.severity; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._results.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div><div style="font-size:9px;color:#6b7280">Risk Score</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div><div style="font-size:9px;color:#6b7280">Critical</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div><div style="font-size:9px;color:#6b7280">High Risk</div></div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px;margin-bottom:6px">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:2px;margin-right:3px"></span>Critical</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:2px;margin-right:3px"></span>High</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#eab308;border-radius:2px;margin-right:3px"></span>Medium</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:2px;margin-right:3px"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderBarChart(): any {
    const data = this._results.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}} as any)[item.severity] || 2, risk: item.severity || 'medium' }));
    const w = 380, h = 160;
    const bw = Math.max(18, Math.floor((w - 50) / data.length) - 4);
    const colors: any = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Score Chart</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:440px">
        ${[0,5,10].map(v => html`<line x1="35" y1="${h - 20 - (v / 10) * (h - 45)}" x2="${w - 10}" y2="${h - 20 - (v / 10) * (h - 45)}" stroke="#1f2937" stroke-width="0.5"/><text x="30" y="${h - 18 - (v / 10) * (h - 45)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => html`<g><rect x="${40 + i * (bw + 4)}" y="${h - 20 - (d.score / 10) * (h - 45)}" width="${bw}" height="${(d.score / 10) * (h - 45)}" fill="${(colors[d.risk] || '#8b5cf6')}60" rx="2" stroke="${colors[d.risk] || '#8b5cf6'}" stroke-width="0.5"/><text x="${40 + i * (bw + 4) + bw / 2}" y="${h - 6}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-25, ${40 + i * (bw + 4) + bw / 2}, ${h - 6})">${d.name}</text></g>`)}
        <line x1="35" y1="${h - 20}" x2="${w - 10}" y2="${h - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEnhancedSection(): any {
    if (!this._showEnhanced) return nothing;
    return html`<div style="margin-top:16px;border-top:1px solid #374151;padding-top:16px">
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      <div style="margin-top:12px">
        ${this._renderRiskGauge()}
        ${this._renderBarChart()}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._results.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  render() {
    const c = this._config;
    const primary = this._results[0];
    const methodProfile = METHOD_PROFILES[c.method];

    return html`
      <div class="panel">
        <div class="header"><div class="title"><span>&#x1F4E4;</span> Data Exfiltration Analyzer</div></div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'config' ? 'active' : ''}" @click=${() => { this._activeTab = 'config'; }}>Configuration</button>
          <button class="tab ${this._activeTab === 'analysis' ? 'active' : ''}" @click=${() => { this._activeTab = 'analysis'; }}>Detection Analysis</button>
          <button class="tab ${this._activeTab === 'timeline' ? 'active' : ''}" @click=${() => { this._activeTab = 'timeline'; }}>Bandwidth Timeline</button>
          <button class="tab ${this._activeTab === 'dlp' ? 'active' : ''}" @click=${() => { this._activeTab = 'dlp'; }}>DLP Controls</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History (${this._history.length})</button>
        </div>

        ${this._activeTab === 'config' ? html`
          <div class="form-grid">
            <div class="form-group"><label>Data Source</label><select .value=${c.source} @change=${(e: Event) => { this._config.source = (e.target as HTMLSelectElement).value as DataSource; }}>
              <option value="database">Database</option><option value="file-server">File Server</option><option value="cloud-storage">Cloud Storage</option>
              <option value="email-archive">Email Archive</option><option value="source-code">Source Code</option><option value="credentials">Credentials</option>
              <option value="piii-data">PII Data</option><option value="financial-data">Financial Data</option><option value="intellectual-property">Intellectual Property</option>
              <option value="customer-data">Customer Data</option>
            </select></div>
            <div class="form-group"><label>Exfiltration Method</label><select .value=${c.method} @change=${(e: Event) => { this._config.method = (e.target as HTMLSelectElement).value as ExfilMethod; }}>
              ${Object.keys(METHOD_PROFILES).map(m => html`<option value=${m}>${m.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`)}
            </select></div>
            <div class="form-group"><label>Data Volume (MB)</label><input type="number" .value=${String(c.volume)} @input=${(e: Event) => { this._config.volume = parseInt((e.target as HTMLInputElement).value) || 0; }}></div>
            <div class="form-group"><label>Transfer Speed</label><select .value=${c.speed} @change=${(e: Event) => { this._config.speed = (e.target as HTMLSelectElement).value; }}>
              <option value="100KB/s">100 KB/s</option><option value="500KB/s">500 KB/s</option><option value="1MB/s">1 MB/s</option><option value="5MB/s">5 MB/s</option><option value="10MB/s">10 MB/s</option><option value="50MB/s">50 MB/s</option>
            </select></div>
            <div class="form-group"><label>Encryption</label><select .value=${c.encryption} @change=${(e: Event) => { this._config.encryption = (e.target as HTMLSelectElement).value; }}>
              <option value="none">None (Plaintext)</option><option value="AES-128">AES-128</option><option value="AES-256">AES-256</option><option value="RSA">RSA</option><option value="ChaCha20">ChaCha20</option>
            </select></div>
            <div class="form-group"><label>Encoding</label><select .value=${c.encoding} @change=${(e: Event) => { this._config.encoding = (e.target as HTMLSelectElement).value; }}>
              <option value="plaintext">Plaintext</option><option value="base64">Base64</option><option value="hex">Hex Encoding</option><option value="custom">Custom Binary</option>
            </select></div>
            <div class="form-group"><label>Scheduling</label><select .value=${c.scheduling} @change=${(e: Event) => { this._config.scheduling = (e.target as HTMLSelectElement).value; }}>
              <option value="immediate">Immediate</option><option value="off-hours">Off-Hours Only</option><option value="random">Random Intervals</option><option value="scheduled">Scheduled Bursts</option>
            </select></div>
            <div class="form-group"><label>Target Region</label><select .value=${c.targetRegion} @change=${(e: Event) => { this._config.targetRegion = (e.target as HTMLSelectElement).value; }}>
              <option value="us-east">US East</option><option value="eu-west">EU West</option><option value="ap-southeast">AP Southeast</option><option value="cn-north">China</option><option value="ru-central">Russia</option>
            </select></div>
          </div>
          <div style="margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${c.obfuscation} @change=${(e: Event) => { this._config.obfuscation = (e.target as HTMLInputElement).checked; } style="accent-color:#3b82f6"> Data obfuscation (chunking, padding)</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${c.compression} @change=${(e: Event) => { this._config.compression = (e.target as HTMLInputElement).checked; } style="accent-color:#3b82f6"> Compression (zlib)</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ?checked=${c.jitter} @change=${(e: Event) => { this._config.jitter = (e.target as HTMLInputElement).checked; } style="accent-color:#3b82f6"> Timing jitter</label>
          </div>
          ${methodProfile ? html`
            <div style="background:#1e293b;border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px">
              <strong>${methodProfile.method.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>:
              Bandwidth ${methodProfile.bandwidth} | Max ${methodProfile.maxVolume} | Stealth ${methodProfile.stealth}/10 | Complexity: ${methodProfile.complexity}
            </div>
          ` : nothing}
          <div class="btn-row"><button class="btn btn-primary" @click=${this._analyze}>Analyze Detection Probability</button></div>
        ` : nothing}

        ${this._activeTab === 'analysis' ? html`
          ${this._results.length === 0 ? html`<div class="empty-state">Configure and analyze first</div>` : html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:${primary?.probability > 50 ? '#f87171' : '#fbbf24'}">${primary?.probability || 0}%</div><div class="stat-label">Primary Detection Risk</div></div>
              <div class="stat"><div class="stat-value">${c.volume} MB</div><div class="stat-label">Data Volume</div></div>
              <div class="stat"><div class="stat-value">${Math.round(c.volume / parseFloat(c.speed))}s</div><div class="stat-label">Est. Duration</div></div>
              <div class="stat"><div class="stat-value">${methodProfile?.stealth || 0}/10</div><div class="stat-label">Stealth Rating</div></div>
            </div>
            <div style="font-weight:600;margin-bottom:8px">Detection Probability by Method</div>
            ${this._results.map(r => html`
              <div class="result-card ${r.probability > 50 ? 'result-high' : r.probability > 25 ? 'result-medium' : 'result-low'}" @click=${() => { this._expandedMethod = this._expandedMethod === r.method ? null : r.method; }}>
                <div class="result-name">
                  ${r.method}
                  <span style="font-size:12px;color:${r.probability > 50 ? '#f87171' : '#fbbf24'};font-weight:700">${r.probability}%</span>
                  <span style="font-size:11px;color:#9ca3af">Conf: ${r.confidence}%</span>
                  <span style="font-size:11px;color:#6b7280">${r.bandwidthImpact}</span>
                </div>
                <div class="prob-bar"><div class="prob-fill" style="width:${r.probability}%;background:${r.probability > 50 ? '#dc2626' : r.probability > 25 ? '#f59e0b' : '#3b82f6'}"></div></div>
                ${this._expandedMethod === r.method ? html`
                  <div class="detail-panel">
                    <div class="detail-title">Detection Factors:</div>
                    <div class="factor-list">${r.factors.map(f => html`<div class="factor-item">- ${f}</div>`)}</div>
                    <div style="font-size:12px;margin-top:8px"><strong style="color:#34d399">Mitigation:</strong> ${r.mitigation}</div>
                    ${(() => {
                      const mp = Object.values(METHOD_PROFILES).find(p => p.method === r.method.toLowerCase().replace(/ /g, '-'));
                      if (!mp) return nothing;
                      return html`
                        <div class="detail-title" style="margin-top:12px">Detection by Tool:</div>
                        ${mp.detectabilityByTool.map(t => html`
                          <div class="tool-row">
                            <span class="tool-name">${t.tool}</span>
                            <div class="tool-bar"><div class="tool-fill" style="width:${t.confidence}%;background:${t.detectable ? '#34d399' : '#f87171'}"></div></div>
                            <span style="font-size:11px;color:${t.detectable ? '#34d399' : '#f87171'};min-width:50px;text-align:right">${t.confidence}%</span>
                          </div>
                        `)}
                        <div class="detail-title" style="margin-top:12px">Indicators:</div>
                        ${mp.indicators.map(ind => html`
                          <div class="indicator-item">
                            <span class="indicator-name">${ind.name}</span>
                            <span class="indicator-sev ${ind.severity === 'critical' ? 'sev-critical' : ind.severity === 'high' ? 'sev-high' : ind.severity === 'medium' ? 'sev-medium' : 'sev-low'}">${ind.severity}</span>
                            <span style="color:#9ca3af">${ind.description}</span>
                          </div>
                        `)}
                      `;
                    })()}
                  </div>
                ` : nothing}
              </div>
            `)}
          `}
        ` : nothing}

        ${this._activeTab === 'timeline' ? html`
          <div style="font-weight:600;margin-bottom:8px">Simulated Bandwidth Usage (24h window)</div>
          ${this._timeline.length > 0 ? html`
            <div class="timeline-bar">
              ${this._timeline.map(t => {
                const color = t.activity > 60 ? '#dc2626' : t.activity > 30 ? '#f59e0b' : '#3b82f6';
                return html`<div class="timeline-block" style="height:${t.activity}%;background:${color}">
                  <span class="timeline-label">${t.hour}h</span>
                </div>`;
              })}
            </div>
            <div style="display:flex;gap:16px;font-size:11px;margin-top:24px">
              <span><span style="display:inline-block;width:12px;height:12px;background:#dc2626;border-radius:2px;vertical-align:middle;margin-right:4px"></span>High exfil activity</span>
              <span><span style="display:inline-block;width:12px;height:12px;background:#f59e0b;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Moderate</span>
              <span><span style="display:inline-block;width:12px;height:12px;background:#3b82f6;border-radius:2px;vertical-align:middle;margin-right:4px"></span>Low/Cover traffic</span>
            </div>
            <div style="margin-top:16px;font-size:12px;color:#9ca3af">Total estimated transfer: ${this._timeline.reduce((s, t) => s + t.volume, 0)} MB | Peak hour: ${this._timeline.reduce((a, b) => a.activity > b.activity ? a : b).hour}:00</div>
          ` : html`<div class="empty-state">Run analysis to see timeline</div>`}
        ` : nothing}

        ${this._activeTab === 'dlp' ? html`
          <div style="font-weight:600;margin-bottom:8px">Data Loss Prevention Controls</div>
          ${DLP_CONTROLS.map(d => html`
            <div class="dlp-card">
              <div class="dlp-status ${d.enabled ? 'on' : 'off'}"></div>
              <div class="dlp-info">
                <div class="dlp-name">${d.name}</div>
                <div class="dlp-coverage">${d.coverage}</div>
                ${d.gapDescription ? html`<div class="dlp-gap">Gap: ${d.gapDescription}</div>` : nothing}
              </div>
              <div class="dlp-effectiveness">
                <div style="font-size:18px;font-weight:700;color:${d.effectiveness >= 70 ? '#34d399' : d.effectiveness >= 40 ? '#fbbf24' : '#f87171'}">${d.effectiveness}%</div>
                <div style="font-size:9px;color:#9ca3af">effective</div>
              </div>
            </div>
          `)}
          <div style="margin-top:12px;font-size:12px;color:#fbbf24">${DLP_CONTROLS.filter(d => !d.enabled).length} DLP controls are disabled</div>
          <div class="btn-row"><button class="btn btn-secondary btn-sm" @click=${this._exportReport}>Export Full Report (JSON)</button></div>
        ` : nothing}

        ${this._activeTab === 'history' ? html`
          ${this._history.length === 0 ? html`<div class="empty-state">No analysis history</div>` : this._history.map(h => html`
            <div class="history-item">
              <div style="font-weight:600;font-size:13px">${h.id} - ${h.config.method.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
              <div style="font-size:11px;color:#9ca3af">
                Source: ${h.config.source} | Volume: ${h.config.volume} MB | Risk: <span style="color:${h.totalRisk > 50 ? '#f87171' : '#fbbf24'}">${h.totalRisk}%</span>
                | ${new Date(h.completedAt).toLocaleString()}
              </div>
            </div>
          `)}
        ` : nothing}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
