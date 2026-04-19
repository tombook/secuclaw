---
name: openscap
nameEn: OpenSCAP Security Compliance
description: 开源安全合规性评估工具，支持漏洞扫描、配置审计和合规检查
sources:
  product: OpenSCAP
  homepage: https://www.open-scap.org
  api_doc: https://www.open-scap.org/resources/documentation/
  github: https://github.com/OpenSCAP/openSCAP
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "📋"
    role: COMPLIANCE
    combination: single
    version: "1.3"
    capabilities:
      light: ["合规检查", "配置审计", "漏洞扫描"]
      dark: ["安全配置评估", "攻击路径分析"]
      security: ["安全合规", "配置核查"]
      legal: ["等保检查", "PCI-DSS", "HIPAA"]
      technology: ["自动化合规"]
      business: ["合规管理", "风险评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  openscap_cli:
    type: cli
    command: oscap
    options:
      - name: --profile
        description: 安全配置文件
      - name: --results
        description: 结果文件
      - name: --report
        description: 报告文件
prompts:
  audit:
    - role: system
      content: |
        你是一个专业的OpenSCAP合规分析助手，擅长：
        1. 执行安全合规扫描
        2. 分析配置审计结果
        3. 生成合规报告
        4. 提供修复建议
  assess:
    - role: system
      content: |
        使用OpenSCAP进行评估时，请：
        1. 选择合适的合规配置文件
        2. 分析漏洞和配置问题
        3. 评估风险等级
integration:
  install:
    command: |
      # Ubuntu/Debian
      apt-get install openscap-scanner scap-security-guide
      # RHEL/CentOS
      yum install openscap-scanner scap-security-guide
      # macOS
      brew install oscap
  config:
    - name: ssg_profile
      label: SSG配置文件
      type: string
      default: "xccdf_org.ssgproject.content_profile_cis"
  test:
    command: |
      oscap --version
      oscap info ssg-debian10-ds.xml
    expect: "OpenSCAP"