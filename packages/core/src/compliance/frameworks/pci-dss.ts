export interface PciDssControl {
  id: string;
  requirement: number;
  name: string;
  description: string;
  testingProcedure: string;
  assessmentMethod: 'examine' | 'interview' | 'observe';
}

export const PCI_DSS_REQUIREMENTS: Array<{ number: number; name: string; description: string }> = [
  { number: 1, name: 'Install and maintain network security controls', description: 'Firewalls and network configurations to protect cardholder data' },
  { number: 2, name: 'Apply secure configurations to all system components', description: 'Vendor-supplied defaults and security parameters' },
  { number: 3, name: 'Protect stored account data', description: 'Encryption and protection of stored cardholder data' },
  { number: 4, name: 'Protect cardholder data with strong cryptography', description: 'Encryption of cardholder data over open, public networks' },
  { number: 5, name: 'Protect against malicious software', description: 'Anti-virus and anti-malware protection' },
  { number: 6, name: 'Develop and maintain secure systems and software', description: 'Secure systems and applications development lifecycle' },
  { number: 7, name: 'Restrict access to system components and cardholder data', description: 'Need-to-know access control' },
  { number: 8, name: 'Identify users and authenticate access', description: 'Strong access control measures and identity management' },
  { number: 9, name: 'Restrict physical access to cardholder data', description: 'Physical access restrictions' },
  { number: 10, name: 'Log and monitor all access', description: 'Tracking and monitoring of all access to network resources' },
  { number: 11, name: 'Test security of systems and networks regularly', description: 'Regular testing of security systems and processes' },
  { number: 12, name: 'Support information security with organizational policies', description: 'Information security policy and operational procedures' },
];

export const PCI_DSS_CONTROLS: PciDssControl[] = [
  { id: 'Req-1.1', requirement: 1, name: 'Network security controls defined', description: 'Establish and maintain network security controls', testingProcedure: 'Examine documentation and configuration standards', assessmentMethod: 'examine' },
  { id: 'Req-1.2', requirement: 1, name: 'Secure network configurations', description: 'Network configurations are secured and managed', testingProcedure: 'Review firewall and router configuration files', assessmentMethod: 'examine' },
  { id: 'Req-1.3', requirement: 1, name: 'Restrict connections to cardholder data', description: 'Restrict inbound and outbound traffic to necessary communications', testingProcedure: 'Observe network traffic filtering rules', assessmentMethod: 'observe' },
  { id: 'Req-2.1', requirement: 2, name: 'Processes for system component hardening', description: 'Establish and maintain processes for system component hardening', testingProcedure: 'Interview personnel and examine hardening documentation', assessmentMethod: 'interview' },
  { id: 'Req-2.2', requirement: 2, name: 'System component configurations', description: 'Develop configuration standards for all system components', testingProcedure: 'Examine configuration standards and compare against components', assessmentMethod: 'examine' },
  { id: 'Req-3.1', requirement: 3, name: 'Processes for protecting stored data', description: 'Processes for protecting stored account data are defined and understood', testingProcedure: 'Interview responsible personnel and examine data retention policies', assessmentMethod: 'interview' },
  { id: 'Req-3.2', requirement: 3, name: 'Sensitive authentication data not stored', description: 'Sensitive authentication data is not stored after authorization', testingProcedure: 'Examine data sources and storage systems', assessmentMethod: 'examine' },
  { id: 'Req-4.1', requirement: 4, name: 'Strong cryptography for transmission', description: 'Strong cryptographic and security protocols for transmission', testingProcedure: 'Observe transmission mechanisms and examine certificates', assessmentMethod: 'observe' },
  { id: 'Req-4.2', requirement: 4, name: 'Verify certificates and keys', description: 'Ensure certificates and keys are properly managed', testingProcedure: 'Examine certificate management processes', assessmentMethod: 'examine' },
  { id: 'Req-5.1', requirement: 5, name: 'Malicious software protection', description: 'Processes to identify and protect against malicious software', testingProcedure: 'Examine anti-malware solutions and configuration', assessmentMethod: 'examine' },
  { id: 'Req-5.2', requirement: 5, name: 'Anti-malware mechanisms deployed', description: 'Malicious software is prevented or detected and addressed', testingProcedure: 'Observe anti-malware deployment across systems', assessmentMethod: 'observe' },
  { id: 'Req-6.1', requirement: 6, name: 'Secure systems development lifecycle', description: 'Establish and maintain secure systems and software development processes', testingProcedure: 'Interview development team and examine SDLC documentation', assessmentMethod: 'interview' },
  { id: 'Req-6.2', requirement: 6, name: 'Vulnerability management in development', description: 'Software development processes include vulnerability identification and remediation', testingProcedure: 'Examine vulnerability tracking and remediation records', assessmentMethod: 'examine' },
  { id: 'Req-6.3', requirement: 6, name: 'Security vulnerability identification', description: 'Security vulnerabilities are identified and resolved', testingProcedure: 'Review vulnerability scan results and patch records', assessmentMethod: 'examine' },
  { id: 'Req-7.1', requirement: 7, name: 'Access control based on need to know', description: 'Define and understand access needs based on least privilege', testingProcedure: 'Interview personnel and examine access control policies', assessmentMethod: 'interview' },
  { id: 'Req-7.2', requirement: 7, name: 'Access control systems configured', description: 'Access to system components and data is restricted to least privilege', testingProcedure: 'Examine access control lists and role assignments', assessmentMethod: 'examine' },
  { id: 'Req-8.1', requirement: 8, name: 'User identification and authentication', description: 'Processes to identify and authenticate users are defined', testingProcedure: 'Examine authentication policies and procedures', assessmentMethod: 'examine' },
  { id: 'Req-8.2', requirement: 8, name: 'Strong authentication credentials', description: 'User authentication credentials are strong and managed', testingProcedure: 'Examine password policies and MFA configurations', assessmentMethod: 'examine' },
  { id: 'Req-8.3', requirement: 8, name: 'Multi-factor authentication', description: 'MFA is required for all access to cardholder data', testingProcedure: 'Observe MFA implementation for administrative and user access', assessmentMethod: 'observe' },
  { id: 'Req-9.1', requirement: 9, name: 'Physical access controls', description: 'Processes to restrict physical access to cardholder data', testingProcedure: 'Observe physical access controls at data centers', assessmentMethod: 'observe' },
  { id: 'Req-9.2', requirement: 9, name: 'Physical access monitoring', description: 'Physical access to cardholder data is monitored and controlled', testingProcedure: 'Examine visitor logs and physical access audit trails', assessmentMethod: 'examine' },
  { id: 'Req-10.1', requirement: 10, name: 'Logging and monitoring processes', description: 'Logging and monitoring processes are defined and understood', testingProcedure: 'Interview security team about logging procedures', assessmentMethod: 'interview' },
  { id: 'Req-10.2', requirement: 10, name: 'Audit logs reviewed', description: 'Audit logs are reviewed to identify anomalies', testingProcedure: 'Examine log review processes and tools', assessmentMethod: 'examine' },
  { id: 'Req-11.1', requirement: 11, name: 'Security testing processes', description: 'Security testing processes are defined and understood', testingProcedure: 'Examine security testing policies and schedules', assessmentMethod: 'examine' },
  { id: 'Req-11.2', requirement: 11, name: 'Wireless access point detection', description: 'Unauthorized wireless access points are detected and addressed', testingProcedure: 'Observe wireless scanning tools and processes', assessmentMethod: 'observe' },
  { id: 'Req-11.3', requirement: 11, name: 'External and internal penetration testing', description: 'External and internal penetration testing is regularly performed', testingProcedure: 'Examine penetration testing reports and remediation records', assessmentMethod: 'examine' },
  { id: 'Req-12.1', requirement: 12, name: 'Information security policy', description: 'A comprehensive information security policy is established and maintained', testingProcedure: 'Examine information security policy documentation', assessmentMethod: 'examine' },
  { id: 'Req-12.2', requirement: 12, name: 'Security responsibilities', description: 'Security roles and responsibilities are clearly defined', testingProcedure: 'Interview management about security responsibilities', assessmentMethod: 'interview' },
  { id: 'Req-12.3', requirement: 12, name: 'Security awareness program', description: 'Security awareness program is implemented for all personnel', testingProcedure: 'Examine training materials and attendance records', assessmentMethod: 'examine' },
  { id: 'Req-12.4', requirement: 12, name: 'Incident response plan', description: 'Incident response plan is established and tested', testingProcedure: 'Examine incident response plan and test results', assessmentMethod: 'examine' },
];

export function getControlsByRequirement(reqNumber: number): PciDssControl[] {
  return PCI_DSS_CONTROLS.filter(c => c.requirement === reqNumber);
}

export function generatePciDssRegulation() {
  return {
    id: 'pci-dss-v4',
    name: 'PCI-DSS v4.0',
    fullName: 'Payment Card Industry Data Security Standard Version 4.0',
    jurisdiction: 'Global',
    version: '4.0',
    effectiveDate: new Date('2024-03-31').getTime(),
    authority: 'PCI Security Standards Council',
    controlFramework: {
      domains: PCI_DSS_REQUIREMENTS.map(r => r.name),
      totalControls: PCI_DSS_CONTROLS.length,
    },
    requirements: {
      mandatory: true,
      penalties: 'Fines, increased audit frequency, loss of card processing privileges',
      auditCycle: 'annual',
    },
    compliance: {
      score: 0,
      compliant: 0,
      partial: 0,
      nonCompliant: PCI_DSS_CONTROLS.length,
    },
  };
}
