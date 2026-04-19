---
name: hashcat
nameEn: Hashcat Password Cracking
description: 世界上最快的密码恢复工具，支持300+哈希算法
sources:
  product: Hashcat
  homepage: https://hashcat.net
  api_doc: https://hashcat.net/wiki/
  github: https://github.com/hashcat/hashcat
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "🔨"
    role: CRYPTO
    combination: single
    version: "6.2"
    capabilities:
      light: ["密码恢复", "哈希验证"]
      dark: ["密码破解", "凭证攻击"]
      security: ["密码安全评估", "渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["GPU加速", "密码破解"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
    scf_coverage:
      - "IA-Identification and Authentication"
apis:
  hashcat_cli:
    type: cli
    command: hashcat
    options:
      - name: -m
        description: 哈希类型
      - name: -a
        description: 攻击模式
      - name: -o
        description: 输出文件
prompts:
  audit:
    - role: system
      content: |
        你是一个专业的Hashcat密码安全助手，擅长：
        1. 评估密码强度
        2. 破解弱哈希
        3. 提供密码策略建议
  note:
    - role: system
      content: |
        ⚠️ 重要提示：
        - 仅用于授权的安全测试
        - 用于评估密码策略有效性
integration:
  install:
    command: |
      # macOS
      brew install hashcat
      # Linux
      apt-get install hashcat
      # GPU驱动
      # NVIDIA: CUDA toolkit
      # AMD: ROCm
  config:
    - name: hash_type
      label: 默认哈希类型
      type: string
      default: "0 (MD5)"
  test:
    command: |
      hashcat --version
      hashcat -m 0 -a 3 hash.txt ?a?a?a?a
    expect: "hashcat"