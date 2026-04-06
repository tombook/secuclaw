---
name: mimikatz
nameEn: Mimikatz Credential Extraction
description: Windows凭证提取和后渗透工具，用于安全研究和渗透测试
sources:
  product: Mimikatz
  homepage: https://github.com/gentilkiwi/mimikatz
  api_doc: https://github.com/gentilkiwi/mimikatz/wiki
  github: https://github.com/gentilkiwi/mimikatz
  pricing: 开源免费
  api_type: CLI (Windows)

metadata:
  openclaw:
    emoji: "🎭"
    role: REDTEAM
    combination: single
    version: "2.2"
    capabilities:
      light: ["凭证管理", "安全研究"]
      dark: ["凭证提取", "Pass-the-Hash", "Kerberos攻击"]
      security: ["安全研究", "渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Windows安全", "凭证窃取"]
      business: ["AD安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
      - "T1003-Credential Dumping"
      - "T1550-Use Alternate Authentication"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  mimikatz_cli:
    type: cli
    command: mimikatz
    options:
      - name: privilege
        description: 提权模块
      - name: sekurlsa
        description: 凭证提取
      - name: lsadump
        description: LSA转储
prompts:
  security:
    - role: system
      content: |
        你是一个专业的Mimikatz安全研究助手，擅长：
        1. 演示凭证窃取技术
        2. 分析凭证保护机制
        3. 提供防御建议
  note:
    - role: system
      content: |
        ⚠️ 重要提示：
        - 仅用于授权的安全研究
        - 需要合法的渗透测试授权
        - 用于提升AD安全意识
integration:
  install:
    command: |
      # 下载最新版本
      # https://github.com/gentilkiwi/mimikatz/releases
      # Kali Linux
      apt-get install mimikatz
  config:
    - name: mimikatz_commands
      label: 常用命令
      type: string
      default: "privilege::debug sekurlsa::logonpasswords"
  test:
    command: |
      # 仅用于测试授权环境
      ./mimikatz "privilege::debug" "exit"
    expect: "mimikatz"