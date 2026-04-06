---
name: dirbuster
nameEn: DirBuster Directory
description: OWASP目录和文件暴力破解工具
sources:
  product: DirBuster
  homepage: https://owasp.org/www-project/dirbuster/
  api_doc: https://owasp.org/www-project/dirbuster/
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "💼"
    role: WEB
    combination: single
    version: "1.0"
    capabilities:
      light: ["目录扫描", "文件发现"]
      dark: ["隐藏资源探测"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["Web枚举"]
      business: ["攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  dirbuster_cli:
    type: cli
    command: dirbuster
    options:
      - name: -u
        description: 目标URL
      - name: -l
        description: 字典文件
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的DirBuster扫描助手，擅长：
        1. 发现隐藏目录
        2. 暴力破解文件
        3. 评估攻击面
integration:
  install:
    command: |
      # Kali Linux
      # 已预装
      # 源码
      # https://sourceforge.net/projects/dirbuster/
  config:
    - name: dirbuster_dict
      label: 默认字典
      type: string
      default: "/usr/share/wordlists/dirb/big.txt"
  test:
    command: |
      dirbuster &
    expect: "DirBuster"