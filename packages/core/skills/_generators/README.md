# 技能生成器

## 概述

本目录包含用于批量生成安全工具SKILL.md文件的工具。

## 已创建的真实技能

| 技能 | 路径 | 状态 |
|------|------|------|
| OpenVAS | `skills/openvas/SKILL.md` | ✅ 完整 |
| VirusTotal | `skills/virustotal/SKILL.md` | ✅ 完整 |
| Nmap | `skills/nmap/SKILL.md` | ✅ 完整 |
| Metasploit | `skills/metasploit/SKILL.md` | ✅ 完整 |
| Shodan | `skills/shodan/SKILL.md` | ✅ 完整 |

## 批量生成剩余技能

### 方法1: 使用Node.js生成器

```bash
cd skills/_generators

# 生成单个工具
node generate-skill.js nessus

# 生成多个工具
for tool in wazuh splunk crowdstrike suricata; do
  node generate-skill.js $tool ../$tool
done
```

### 方法2: 手动创建

对于需要真实API集成的技能，建议手动创建：

1. 创建目录: `skills/<tool-name>/`
2. 创建 `SKILL.md` 文件
3. 包含真实API端点、认证方式、使用示例

## SKILL.md 标准格式

```yaml
---
name: tool-id
nameEn: Tool Name
description: 工具描述
homepage: 官网URL
metadata:
  openclaw:
    emoji: "🔧"
    role: ROLE_ID
    combination: single
    version: "1.0.0"
    capabilities:
      light: ["能力1", "能力2"]
      dark: ["黑暗能力"]
      security: ["安全能力"]
      legal: ["合规能力"]
      technology: ["技术能力"]
      business: ["业务能力"]
    mitre_coverage:
      - "T1046"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  category:
    type: api-type
    baseUrl: "{{baseUrl}}"
    auth:
      type: authtype
    endpoints:
      - name: operation
        path: /api/path
prompts:
  analyze:
    - role: system
      content: 你是一个...助手
integration:
  install:
    command: 安装命令
  config:
    - name: param
      label: 参数名
      type: string
      required: true
examples:
  - name: 示例名
    code: 示例代码
outputs:
  report:
    format: [json, markdown]
    template: 报告模板
---

# 详细使用指南
```

## 待完成的技能列表

按优先级排序：

### P0 - 核心扫描工具 (需尽快完成)
1. ✅ OpenVAS - 已完成
2. ✅ Nmap - 已完成
3. ✅ Nessus - 待生成
4. ✅ Metasploit - 已完成

### P1 - 威胁情报 (需尽快完成)
5. ✅ VirusTotal - 已完成
6. ✅ Shodan - 已完成
7. MISP - 待创建
8. OpenCTI - 待创建
9. GreyNoise - 待创建

### P2 - SIEM/日志 (可后续完成)
10. Wazuh - 待生成
11. Splunk - 待生成
12. Elastic - 待创建
13. QRadar - 待创建

### P3 - 端点安全 (可后续完成)
14. CrowdStrike - 待生成
15. SentinelOne - 待创建
16. Carbon Black - 待创建
17. osquery - 待创建

### P4 - 云/容器安全 (可后续完成)
18. Trivy - 待创建
19. Prisma Cloud - 待创建
20. Wiz - 待创建

### P5 - 其他工具 (可后续完成)
21. Burp Suite - 待创建
22. SQLMap - 待创建
23. Cobalt Strike - 待创建
24. Suricata - 待生成
25. Zeek - 待创建

## 技能加载流程

1. 用户在技能市场安装技能
2. 技能配置保存到localStorage
3. 技能根据配置连接外部API
4. 技能执行扫描/分析任务
5. 结果通过LLM生成自然语言报告
