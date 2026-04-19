---
name: evil-winrm
nameEn: Evil-WinRM
description: Windows远程管理后门，用于渗透测试和红队演练
sources:
  product: Evil-WinRM
  homepage: https://github.com/Hackplayers/evil-winrm
  api_doc: https://github.com/Hackplayers/evil-winrm
  github: https://github.com/Hackplayers/evil-winrm
  pricing: 开源免费
  api_type: CLI (Ruby)

metadata:
  openclaw:
    emoji: "👿"
    role: REDTEAM
    combination: single
    version: "4.0"
    capabilities:
      light: ["安全研究"]
      dark: ["远程访问", "横向移动"]
      security: ["渗透测试"]
      legal: ["渗透测试授权"]
      technology: ["WinRM"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  evilwinrm_cli:
    type: cli
    command: evil-winrm
    options:
      - name: -i
        description: 目标IP
      - name: -u
        description: 用户名
      - name: -p
        description: 密码
prompts:
  redteam:
    - role: system
      content: |
        你是一个专业的Evil-WinRM助手，擅长：
        1. 执行WinRM远程访问
        2. 演示横向移动
        3. 评估AD安全
integration:
  install:
    command: |
      # macOS
      gem install evil-winrm
      # Linux
      apt-get install evil-winrm
      # Docker
      docker run -it --rm \
        oscar行之有效的安全性/evil-winrm
  config:
    - name: winrm_target
      label: 目标
      type: string
      required: true
  test:
    command: |
      evil-winrm -i 192.168.1.1 -u admin -p password
    expect: "Evil-WinRM"