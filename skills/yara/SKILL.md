---
name: yara
nameEn: YARA Rule Engine
description: 模式和特征匹配工具，用于恶意软件研究和威胁检测
sources:
  product: YARA
  homepage: https://virustotal.github.io/yara
  api_doc: https://yaraproduction.readthedocs.io/
  github: https://github.com/VirusTotal/yara
  pricing: 开源免费
  api_type: CLI + Python库

metadata:
  openclaw:
    emoji: "🔬"
    role: MALWARE
    combination: single
    version: "4.3"
    capabilities:
      light: ["特征检测", "文件分析"]
      dark: ["恶意软件识别", "APT追踪"]
      security: ["威胁检测", "取证分析"]
      legal: ["恶意软件研究"]
      technology: ["模式匹配", "规则引擎"]
      business: ["威胁情报"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0005-Defense Evasion"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  yara_cli:
    type: cli
    command: yara
    options:
      - name: -r
        description: 递归扫描目录
      - name: -d
        description: 定义变量
      - name: -w
        description: 禁用警告
prompts:
  detect:
    - role: system
      content: |
        你是一个专业的YARA规则编写助手，擅长：
        1. 编写检测规则
        2. 分析恶意软件
        3. 优化规则性能
        4. 生成规则文档
integration:
  install:
    command: |
      # macOS
      brew install yara
      # Linux
      apt-get install yara
      # 编译安装
      ./configure && make && make install
  config:
    - name: yara_rules_path
      label: 规则路径
      type: string
      default: "./rules"
  test:
    command: |
      yara --version
      yara -r rules.yar /path/to/scan
    expect: "yara"