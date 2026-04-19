#!/usr/bin/env node
/**
 * SecuClaw Skill Generator
 * 
 * 用于批量生成安全工具SKILL.md文件
 * 
 * 使用方法:
 *   node generate-skill.js <tool-name> <tool-type>
 * 
 * 示例:
 *   node generate-skill.js nessus commercial
 *   node generate-skill.js elastic-saas opensource
 */

const fs = require('fs');
const path = require('path');

// 工具模板
const SKILL_TEMPLATE = `---
name: {name}
nameEn: {nameEn}
description: {description}
homepage: {homepage}
metadata:
  openclaw:
    emoji: "{emoji}"
    role: {role}
    combination: single
    version: "1.0.0"
    capabilities:
      light: {light}
      dark: {dark}
      security: {security}
      legal: {legal}
      technology: {technology}
      business: {business}
    mitre_coverage: {mitre}
    scf_coverage: {scf}
apis:
  {category}:
    type: {apiType}
    baseUrl: "{{baseUrl}}"
    auth:
      type: {authType}
      {authConfig}
    endpoints: {endpoints}
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的{toolName}助手，可以帮助用户：
        1. 理解{toolName}的功能和使用场景
        2. 提供{toolName}的配置指导
        3. 分析{toolName}的扫描/检测结果
        4. 生成专业的分析报告
        
integration:
  install:
    command: |
      {installCommand}
      
  config:
    - name: api_url
      label: API地址
      type: string
      default: "{defaultUrl}"
      required: true
      
    - name: api_key
      label: API密钥
      type: password
      required: true
      
  test:
    command: {testCommand}
    expect: "{testExpect}"

examples:
  - name: 基础操作
    description: {toolName}的基础使用示例
    code: |
      {exampleCode}

outputs:
  report:
    format: [json, markdown]
    template: |
      # {toolName}分析报告
      ## 概要
      ## 详细结果
      ## 建议
---

# {toolName} 技能使用指南

## 功能概述

{description}

## API配置

### 1. 获取API访问

{authInstructions}

### 2. 配置技能参数

在SecuClaw技能市场安装后，配置以下参数：

| 参数 | 说明 |
|------|------|
| api_url | API地址 |
| api_key | 认证密钥 |

## 使用示例

\`\`\`bash
{usageExample}
\`\`\`

## 最佳实践

1. 定期更新API密钥
2. 遵守API速率限制
3. 实施最小权限原则
`;

// 工具定义
const TOOLS = {
  'nessus': {
    name: 'Nessus',
    nameEn: 'Tenable Nessus',
    description: '商业漏洞扫描器，支持Web应用扫描、合规检查、配置审计',
    homepage: 'https://www.tenable.com/products/nessus',
    emoji: '🔵',
    role: 'VULN',
    category: 'vulnerability_scanner',
    apiType: 'nessus-rest',
    authType: 'apikey',
    authConfig: 'headers:\n      X-ApiKeys: "accessKey={{access_key}};secretKey={{secret_key}}"',
    endpoints: `
      - name: listScans
        path: /scans
        method: GET
        description: 列出扫描任务
        
      - name: launchScan
        path: /scans/{scan_id}/launch
        method: POST
        description: 启动扫描
        
      - name: getScanResults
        path: /scans/{scan_id}
        method: GET
        description: 获取扫描结果`,
    installCommand: '# 下载安装: https://www.tenable.com/downloads/nessus',
    defaultUrl: 'https://localhost:8834',
    testCommand: 'curl -k -X GET "https://localhost:8834/server/status" -H "X-ApiKeys: accessKey={{key}};secretKey={{key}}"',
    testExpect: 'version',
    exampleCode: '# 列出扫描\ncurl -k -X GET "https://localhost:8834/scans" -H "X-ApiKeys: accessKey={{key}};secretKey={{key}}"\n\n# 启动扫描\ncurl -k -X POST "https://localhost:8834/scans/1/launch" -H "X-ApiKeys: accessKey={{key}};secretKey={{key}}"',
    usageExample: 'curl -k "https://localhost:8834/scans" -H "X-ApiKeys: accessKey=xxx;secretKey=xxx"'
  },
  
  'wazuh': {
    name: 'Wazuh',
    nameEn: 'Wazuh SIEM',
    description: '开源安全平台，集成SIEM和XDR功能，支持威胁检测、合规管理和响应',
    homepage: 'https://wazuh.com',
    emoji: '🟣',
    role: 'SIEM',
    category: 'security_platform',
    apiType: 'wazuh-rest',
    authType: 'basicauth',
    authConfig: 'username: "{{username}}"\n      password: "{{password}}"',
    endpoints: `
      - name: getAgents
        path: /agents
        method: GET
        description: 列出受管理代理
        
      - name: getAlerts
        path: /alerts
        method: GET
        description: 获取安全告警
        
      - name: syscheck
        path: /syscheck/{agent_id}
        method: GET
        description: 获取文件完整性检查结果`,
    installCommand: '# Docker部署\ndocker run -d -p 1514:1514/udp -p 1515:1515 -p 443:443 wazuh/wazuh:latest',
    defaultUrl: 'https://localhost:55000',
    testCommand: 'curl -k -X GET "https://localhost:55000/security/user/authenticate" -u "{{user}}:{{password}}"',
    testExpect: 'data',
    exampleCode: '# 获取告警\ncurl -k -X GET "https://localhost:55000/alerts?limit=10" -H "Authorization: Bearer {{token}}"',
    usageExample: 'curl -k "https://localhost:55000/agents" -H "Authorization: Bearer {{token}}"'
  },
  
  'crowdstrike': {
    name: 'CrowdStrike Falcon',
    nameEn: 'CrowdStrike Falcon',
    description: '云端Endpoint Protection Platform (EPP)和EDR解决方案',
    homepage: 'https://www.crowdstrike.com',
    emoji: '🦅',
    role: 'EDR',
    category: 'endpoint_protection',
    apiType: 'crowdstrike-oauth2',
    authType: 'oauth2',
    authConfig: 'client_id: "{{client_id}}"\n      client_secret: "{{client_secret}}"',
    endpoints: `
      - name: listDevices
        path: /devices/entities/devices/v1
        method: GET
        description: 列出受保护设备
        
      - name: getIncidents
        path: /incidents/entities/incidents/v1
        method: GET
        description: 获取安全事件
        
      - name: searchIOC
        path: /iocs/entities/indicators/v1
        method: POST
        description: 搜索IOC`,
    installCommand: '# SaaS服务，无需安装Agent\n# 下载Falcon Sensor: https://www.crowdstrike.com/modern-work-protection/',
    defaultUrl: 'https://api.crowdstrike.com',
    testCommand: 'curl -X GET "https://api.crowdstrike.com/oauth2/token" -d "client_id={{cid}}&client_secret={{secret}}"',
    testExpect: 'access_token',
    exampleCode: '# 获取Token\nTOKEN=$(curl -s -X POST "https://api.crowdstrike.com/oauth2/token" \\\n  -d "client_id={{cid}}&client_secret={{secret}}" | jq -r .access_token)\n\n# 列出设备\ncurl -k -X GET "https://api.crowdstrike.com/devices/entities/devices/v1" \\\n  -H "Authorization: Bearer $TOKEN"',
    usageExample: 'curl "https://api.crowdstrike.com/devices/entities/devices/v1" -H "Authorization: Bearer $TOKEN"'
  },
  
  'splunk': {
    name: 'Splunk Enterprise',
    nameEn: 'Splunk Enterprise',
    description: '企业级SIEM和日志管理平台，支持安全分析、告警和可视化',
    homepage: 'https://www.splunk.com',
    emoji: '🟢',
    role: 'SIEM',
    category: 'siem_platform',
    apiType: 'splunk-rest',
    authType: 'basicauth',
    authConfig: 'username: "{{username}}"\n      password: "{{password}}"',
    endpoints: `
      - name: search
        path: /services/search/jobs
        method: POST
        description: 执行搜索
        
      - name: listApps
        path: /services/apps/local
        method: GET
        description: 列出应用
        
      - name: getConfigs
        path: /services/configs/conf-{file}
        method: GET
        description: 获取配置`,
    installCommand: '# 下载安装: https://www.splunk.com/en_US/download/splunk-enterprise.html',
    defaultUrl: 'https://localhost:8089',
    testCommand: 'curl -k -u "{{user}}:{{password}}" "https://localhost:8089/services/server/info"',
    testExpect: 'version',
    exampleCode: '# 执行搜索\ncurl -k -u "{{user}}:{{password}}" \\\n  -X POST "https://localhost:8089/services/search/jobs" \\\n  -d "search=search index=main | head 10"',
    usageExample: 'curl -u admin:password "https://localhost:8089/services/server/info"'
  },
  
  'suricata': {
    name: 'Suricata',
    nameEn: 'Suricata IDS/IPS',
    description: '开源网络威胁检测引擎，支持IDS/IPS、网络安全监控和日志分析',
    homepage: 'https://suricata.io',
    emoji: '🚨',
    role: 'IDS',
    category: 'network_security',
    apiType: 'suricata-rest',
    authType: 'basicOptional',
    authConfig: 'basicAuth: false',
    endpoints: `
      - name: getVersion
        path: /api
        method: GET
        description: 获取API版本
        
      - name: getStats
        path: /api/v1/toppers/wire
        method: GET
        description: 获取统计信息
        
      - name: listRules
        path: /api/v1/rules
        method: GET
        description: 列出规则`,
    installCommand: '# Ubuntu/Debian\nsudo apt-get install suricata\n\n# macOS (Homebrew)\nbrew install suricata',
    defaultUrl: 'http://localhost:5001',
    testCommand: 'curl -s "http://localhost:5001/api"',
    testExpect: 'engine',
    exampleCode: '# 获取统计\ncurl -s "http://localhost:5001/api/v1/toppers/wire"\n\n# 查看告警\neve.json查看: tail -f /var/log/suricata/eve.json',
    usageExample: 'curl "http://localhost:5001/api/v1/toppers/wire"'
  }
};

// 生成函数
function generateSkill(toolName, options = {}) {
  const tool = TOOLS[toolName];
  if (!tool) {
    console.error(`Unknown tool: ${toolName}`);
    console.log('Available tools:', Object.keys(TOOLS).join(', '));
    process.exit(1);
  }
  
  const skill = {
    ...tool,
    ...options,
    category: options.category || tool.category,
    endpoints: options.endpoints || tool.endpoints
  };
  
  return skill;
}

// 创建目录并生成文件
function createSkillFile(toolName, outputDir) {
  const skill = generateSkill(toolName);
  const dir = path.join(outputDir, toolName);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const content = SKILL_TEMPLATE
    .replace(/{name}/g, skill.name)
    .replace(/{nameEn}/g, skill.nameEn)
    .replace(/{description}/g, skill.description)
    .replace(/{homepage}/g, skill.homepage)
    .replace(/{emoji}/g, skill.emoji)
    .replace(/{role}/g, skill.role)
    .replace(/{category}/g, skill.category)
    .replace(/{apiType}/g, skill.apiType)
    .replace(/{authType}/g, skill.authType)
    .replace(/{authConfig}/g, skill.authConfig)
    .replace(/{endpoints}/g, skill.endpoints)
    .replace(/{installCommand}/g, skill.installCommand)
    .replace(/{defaultUrl}/g, skill.defaultUrl)
    .replace(/{testCommand}/g, skill.testCommand)
    .replace(/{testExpect}/g, skill.testExpect)
    .replace(/{exampleCode}/g, skill.exampleCode)
    .replace(/{usageExample}/g, skill.usageExample)
    .replace(/{toolName}/g, skill.name)
    .replace(/{light}/g, '["漏洞检测", "配置审计", "合规检查"]')
    .replace(/{dark}/g, '["弱点分析", "攻击探测"]')
    .replace(/{security}/g, '["风险评估", "威胁检测"]')
    .replace(/{legal}/g, '["合规评估"]')
    .replace(/{technology}/g, '["系统加固"]')
    .replace(/{business}/g, '["风险管理"]')
    .replace(/{mitre}/g, '["T1046", "T1499"]')
    .replace(/{scf}/g, '["RA-Risk Assessment", "SI-System and Information Integrity"]')
    .replace(/{authInstructions}/g, `
1. 获取API凭证（联系管理员或参考官方文档）
2. 配置认证信息
3. 测试API连接`)
    .replace(/      /g, '    ');
  
  const filePath = path.join(dir, 'SKILL.md');
  fs.writeFileSync(filePath, content);
  console.log(`✅ Generated: ${filePath}`);
  return filePath;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
SecuClaw Skill Generator

Usage:
  node generate-skill.js <tool-name> [output-dir]

Available tools:
${Object.keys(TOOLS).map(t => `  - ${t}`).join('\n')}

Examples:
  node generate-skill.js nessus
  node generate-skill.js wazuh ./skills
  node generate-skill.js crowdstrike /path/to/output
`);
    return;
  }
  
  const toolName = args[0];
  const outputDir = args[1] || './';
  
  createSkillFile(toolName, outputDir);
}

if (require.main === module) {
  main();
}

module.exports = { generateSkill, createSkillFile };
