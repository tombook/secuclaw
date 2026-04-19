---
name: zeek
nameEn: Zeek Network Security Monitor
description: 强大的开源网络流量分析器，支持安全监控、威胁检测和取证分析
sources:
  product: Zeek
  homepage: https://zeek.org
  api_doc: https://docs.zeek.org/en/current/scripting/
  github: https://github.com/zeek/zeek
  pricing: 开源免费
  api_type: CLI + Broker

metadata:
  openclaw:
    emoji: "🔬"
    role: NSM
    combination: single
    version: "6.0"
    capabilities:
      light: ["网络监控", "流量分析", "日志记录"]
      dark: ["威胁狩猎", "C2检测", "横向移动分析"]
      security: ["网络分析", "协议分析", "威胁检测"]
      legal: ["合规审计", "取证支持"]
      technology: ["深度流量分析", "网络取证"]
      business: ["网络安全态势"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
      - "TA0007-Discovery"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "AU-Audit and Accountability"
apis:
  zeek_cli:
    type: cli
    command: zeek
    options:
      - name: -r
        description: 读取pcap文件
      - name: -i
        description: 实时网卡
      - name: --local-networks
        description: 本地网络范围
      - name: -C
        description: 检查 Checksum
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Zeek网络分析助手，擅长：
        1. 分析网络流量日志
        2. 检测异常连接
        3. 识别恶意协议
        4. 追踪攻击链
  hunt:
    - role: system
      content: |
        使用Zeek进行威胁狩猎时，请：
        1. 分析DNS查询异常
        2. 检查HTTP User-Agent
        3. 识别SSH暴力破解
        4. 检测数据外泄
integration:
  install:
    command: |
      # Ubuntu/Debian
      apt-get install zeek
      # macOS
      brew install zeek
      # Docker
      docker run --rm -it \
        --net=host \
        zeek/zeek:latest
  config:
    - name: zeek_scripts
      label: 加载的脚本
      type: string
      default: "notice"
    - name: local_network
      label: 本地网络
      type: string
      default: "10.0.0.0/8"
  test:
    command: |
      zeek -v
      zeek -i eth0 list-sites
    expect: "zeek version"