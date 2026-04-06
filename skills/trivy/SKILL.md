---
name: trivy
nameEn: Trivy Vulnerability Scanner
description: 开源容器和Kubernetes漏洞扫描器，支持镜像扫描、配置检查、Secret检测和SBOM生成
sources:
  product: Trivy
  homepage: https://trivy.dev
  api_doc: https://aquasecurity.github.io/trivy/latest/docs/
  github: https://github.com/aquasecurity/trivy
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "💎"
    role: CONTAINER
    combination: single
    version: "0.50"
    capabilities:
      light: ["漏洞扫描", "镜像安全", "配置审计", "Secret检测"]
      dark: ["镜像投毒检测", "恶意软件扫描"]
      security: ["容器安全", "K8s审计", "合规检查"]
      legal: ["Docker合规", "等保检查"]
      technology: ["DevSecOps", "CI/CD集成"]
      business: ["供应链安全", "风险评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "T1525-Implant Internal Image"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
      - "CM-Configuration Management"
apis:
  trivy_cli:
    type: cli
    command: trivy
    install: |
      # macOS
      brew install trivy
      # Linux (Debian/Ubuntu)
      apt-get install trivy
      # Binary
      curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
      # Docker
      docker run --rm aquasec/trivy:{{version}} image {{image_name}}
      # Kubernetes
      kubectl apply -f https://raw.githubusercontent.com/aquasecurity/trivy/main/deploy/trivy.yaml
    options:
      - name: image
        description: 镜像名称:tag
        required: true
      - name: --severity
        description: 漏洞严重性过滤 (UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL)
      - name: --security-checks
        description: 检查类型 (vuln,config,secret)
      - name: --format
        description: 输出格式 (table,json,sarif,html)
      - name: --input
        description: 输入文件 (tar镜像)
      - name: --db-repository
        description: 数据库镜像仓库
      - name: --ignore-unfixed
        description: 忽略未修复漏洞
      - name: --vuln-type
        description: 漏洞类型 (os,library)
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Trivy容器安全扫描助手，擅长：
        1. 执行容器镜像漏洞扫描
        2. 分析漏洞报告和风险评估
        3. 提供修复建议和优先级
        4. 生成容器安全报告
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析Trivy扫描结果时，请提供：
        1. 漏洞分类统计
        2. CVSS评分和风险评级
        3. 可行修复方案
        4. 修复优先级建议
integration:
  install:
    command: |
      # macOS
      brew install trivy
      # Linux
      curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
      # Docker运行
      docker run --rm aquasec/trivy image nginx:latest
  config:
    - name: default_severity
      label: 默认严重性过滤
      type: string
      default: "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"
    - name: security_checks
      label: 安全检查类型
      type: string
      default: "vuln,config,secret"
    - name: output_format
      label: 输出格式
      type: select
      options: ["table", "json", "sarif", "html"]
      default: "table"
    - name: db_repository
      label: 数据库镜像仓库
      type: string
      default: "ghcr.io/aquasecurity/trivy-db"
  test:
    command: trivy image --version
    expect: "Version"
examples:
  - name: 扫描镜像漏洞
    description: 扫描Docker镜像中的漏洞
    code: |
      # 基础漏洞扫描
      trivy image nginx:latest
      # 指定严重性
      trivy image --severity HIGH,CRITICAL nginx:latest
      # 输出JSON格式
      trivy image --format json --output report.json nginx:latest
      # 扫描所有检查
      trivy image --security-checks vuln,config,secret nginx:latest
      # 输出示例
      Results for CRITICAL severity (3)
      ┌─────────────────────┬──────────────────┬──────────┬───────────────────┬──────────────────────────────────┐
      │      Package       │   Vulnerability  │ Severity │    Installed Ver   │         Fixed Version          │
      ├─────────────────────┼──────────────────┼──────────┼───────────────────┼──────────────────────────────────┤
      │        curl        │   CVE-2024-1234  │ CRITICAL │      7.68.0      │            7.68.1             │
      │      libssl1.1     │   CVE-2024-5678  │ CRITICAL │      1.1.1t      │            1.1.1u              │
      │        bash        │   CVE-2024-9012  │ CRITICAL │      5.0.0      │            5.1.0              │
      └─────────────────────┴──────────────────┴──────────┴───────────────────┴──────────────────────────────────┘
  - name: K8s安全检查
    description: 检查Kubernetes安全配置
    code: |
      # 扫描K8s清单
      kubectl get all,configmap,secret -A -o yaml | trivy config -
      # 或扫描指定文件
      trivy config ./kubernetes/
      # 输出Kubernetes安全问题
      ➜ Kubernetes Security Check
      Controls: 23 (FAILED: 5, WARNING: 3, PASS: 15)
      CRITICAL Findings:
      - PrivilegeEscalation: default serviceaccount allows privilege escalation
  - name: CI/CD集成
    description: 在CI/CD管道中扫描
    code: |
      # GitHub Actions
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myimage:tag'
          format: 'sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      # GitLab CI
      trivy:
        stage: security
        image: aquasec/trivy:latest
        script:
          - trivy image --exit-code 1 --severity HIGH,CRITICAL myimage:tag
      # Jenkins
      sh 'trivy image --format json --output trivy-report.json myimage:tag'
outputs:
  report:
    format: [table, json, sarif, html, cyclonedx]
    template: |
      # 容器安全扫描报告
      ## 概要
      - 镜像: {{image_name}}
      - 扫描时间: {{scan_time}}
      - 扫描类型: {{scan_type}}
      ## 漏洞统计
      | 严重性 | 数量 | 可修复 |
      |--------|------|--------|
      | CRITICAL | {{critical}} | {{critical_fixed}} |
      | HIGH | {{high}} | {{high_fixed}} |
      | MEDIUM | {{medium}} | {{medium_fixed}} |
      | LOW | {{low}} | {{low_fixed}} |
      | UNKNOWN | {{unknown}} | - |
      ## 高危漏洞详情
      {{critical_vulns}}
      ## 配置问题
      {{config_issues}}
      ## Secret检测
      {{secrets_found}}
      ## 修复建议
      {{remediation}}
---
# Trivy 技能使用指南
## 功能概述
Trivy 是最流行的开源容器安全工具：
- **漏洞扫描**：操作系统和语言的已知漏洞
- **配置审计**：Kubernetes、Docker、Terraform
- **Secret检测**：API密钥、密码、证书等
- **SBOM生成**：软件物料清单
- **Clair集成**：更深入的镜像分析
## 安装配置
### 1. 安装
```bash
# macOS
brew install trivy
# Linux (Debian/Ubuntu)
curl -sfL https://aquasecurity.github.io/trivy-repo/deb/public.key | apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/trivy.list
apt-get update && apt-get install trivy
# Binary直接下载
curl -sfL https://github.com/aquasecurity/trivy/releases/download/v0.50.0/trivy_0.50.0_Linux-64bit.tar.gz | tar -xzf - -C /usr/local/bin trivy
```
### 2. 常用命令
```bash
# 1. 扫描镜像漏洞
trivy image nginx:latest
# 2. 只显示高危和严重
trivy image --severity HIGH,CRITICAL nginx:latest
# 3. 输出JSON
trivy image --format json --output report.json nginx:latest
# 4. 扫描文件系统
trivy fs /path/to/project
# 5. 扫描K8s配置
trivy config ./kubernetes/
# 6. 扫描tar镜像
trivy image --input archive.tar
# 7. 生成SBOM
trivy image --format cyclonedx --output sbom.json nginx:latest
# 8. 扫描RPM包
trivy image --vuln-type os redis:alpine
# 9. 忽略未修复漏洞
trivy image --ignore-unfixed nginx:latest
# 10. 扫描AWS ECR
trivy image --aws-region us-east-1 123456789.dkr.ecr.us-east-1.amazonaws.com/myimage:latest
```
## 扫描示例
### 智能容器安全分析
```
用户: 扫描 nginx:latest 镜像
助手:
💎 **Trivy 容器安全扫描**
目标: nginx:latest
扫描时间: 2026-03-31 09:00:00
检查类型: 漏洞 + 配置 + Secret
⏱️ 正在下载漏洞数据库...
⏱️ 正在扫描镜像层...
📊 **漏洞统计**
| 严重性 | 数量 | 可修复 | 修复率 |
|--------|------|--------|--------|
| 🔴 CRITICAL | 3 | 3 | 100% |
| 🟠 HIGH | 12 | 10 | 83% |
| 🟡 MEDIUM | 28 | 22 | 79% |
| 🟢 LOW | 45 | 0 | 0% |
| ⚪ UNKNOWN | 2 | - | - |
⚠️ **CRITICAL 漏洞详情**
**1. curl (CVE-2024-1234)**
- 包: libcurl4
- 当前版本: 7.88.1
- 修复版本: 7.88.2
- CVSS: 9.8
- 描述: curl URL解析缓冲区溢出
**2. openssl (CVE-2024-5678)**
- 包: libssl1.1
- 当前版本: 1.1.1t
- 修复版本: 1.1.1u
- CVSS: 9.1
- 描述: OpenSSL拒绝服务
**3. bash (CVE-2024-9012)**
- 包: bash
- 当前版本: 5.2
- 修复版本: 5.2.15
- CVSS: 9.3
- 描述: Bash命令注入
📋 **修复建议**
P0 (立即):
1. 更新基础镜像到最新Debian 12
2. 重新构建镜像层
P1 (本周):
1. 修复所有HIGH漏洞
2. 添加.dockerignore排除敏感文件
✅ **通过检查**
- Secret检测: 通过
- Misconfiguration: 通过 (Dockerfile)
```
## 漏洞类型
| 类型 | 说明 | 示例包 |
|------|------|--------|
| os | 操作系统包 | apt, yum, apk |
| library | 语言包 | npm, pip, gem |
| config | 配置问题 | Dockerfile, K8s |
| secret | 密钥泄露 | AWS key, Password |
## CI/CD集成
### GitHub Actions
```yaml
name: Container Security
on: [push, pull_request]
jobs:
  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'sarif'
          severity: 'CRITICAL,HIGH'
          exit-code: '1' # Fail on critical findings
```