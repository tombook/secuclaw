---
name: john-the-ripper
sources:
  product: John the Ripper
  homepage: https://www.openwall.com/john
  api_doc: https://www.openwall.com/john/doc/
  github: https://github.com/openwall/john
  pricing: 开源免费
  api_type: CLI
metadata:
  openclaw:
    emoji: "🔓"
    role: CRYPTO
    combination: single
    version: "1.9"
    capabilities:
      light: ["密码审计", "哈希验证"]
      dark: ["密码破解", "凭证攻击"]
      security: ["密码安全评估"]
      legal: ["渗透测试授权"]
      technology: ["密码破解"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0006-Credential Access"
    scf_coverage:
      - "IA-Identification and Authentication"
apis:
  john_cli:
    type: cli
    command: john
    options:
      - name: --wordlist
        description: 字典文件
      - name: --format
        description: 哈希格式

prompts:
  audit:
    - role: system
      content: |
        你是一个专业的John密码审计助手，擅长：
        1. 执行密码审计
        2. 破解弱密码
        3. 评估密码策略

integration:
  install:
    command: |
      # macOS
      brew install john-jumbo
      
      # Linux
      apt-get install john
      
      # 编译安装
      # https://www.openwall.com/john
  config:
    - name: john_format
      label: 默认格式
      type: string
      default: "auto"
  test:
    command: |
      john --version
      john --test
    expect: "John"
