---
name: autopsy
nameEn: Autopsy Digital Forensics
description: 开源数字取证平台，支持磁盘镜像分析、文件恢复和证据提取
sources:
  product: Autopsy
  homepage: https://www.autopsy.com
  api_doc: https://hub.docker.com/r/autopsy/autopsy
  github: https://github.com/sleuthkit/autopsy
  pricing: 开源免费
  api_type: CLI + Python

metadata:
  openclaw:
    emoji: "🔍"
    role: FORENSICS
    combination: single
    version: "4.21"
    capabilities:
      light: ["数字取证", "磁盘分析", "文件恢复"]
      dark: ["恶意软件分析", "隐藏数据发现"]
      security: ["取证分析", "事件响应"]
      legal: ["取证支持", "法律证据"]
      technology: ["文件系统分析"]
      business: ["事件调查"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "T1005-Data from Local System"
    scf_coverage:
      - "IR-Incident Response"
apis:
  autopsy_cli:
    type: cli
    command: autopsy
    options:
      - name: --memory
        description: 内存镜像
      - name: --disk
        description: 磁盘镜像
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Autopsy取证分析助手，擅长：
        1. 分析磁盘镜像
        2. 恢复删除文件
        3. 提取证据
        4. 生成取证报告
integration:
  install:
    command: |
      # macOS
      brew install --cask autopsy
      # Linux
      apt-get install autopsy
      # Windows
      # 下载安装包
  config:
    - name: autopsy_case_path
      label: 案例路径
      type: string
      default: "/cases"
  test:
    command: |
      autopsy --version
    expect: "Autopsy"