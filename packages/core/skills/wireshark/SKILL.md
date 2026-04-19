---
name: wireshark
nameEn: Wireshark
description: 网络协议分析器，用于网络流量抓包、协议分析和故障排除
sources:
  product: Wireshark
  homepage: https://wireshark.org
  api_doc: https://www.wireshark.org/docs/
  github: https://github.com/wireshark/wireshark
  pricing: 开源免费
  api_type: CLI (tshark)

metadata:
  openclaw:
    emoji: "📡"
    role: NSM
    combination: single
    version: "4.2"
    capabilities:
      light: ["流量分析", "协议分析", "故障排除"]
      dark: ["恶意流量检测", "取证分析"]
      security: ["网络安全", "威胁检测"]
      legal: ["取证分析"]
      technology: ["深度包检测"]
      business: ["网络诊断"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  wireshark_cli:
    type: cli
    command: tshark
    options:
      - name: -i
        description: 网卡接口
      - name: -r
        description: 读取pcap文件
      - name: -Y
        description: 显示过滤器
      - name: -w
        description: 输出文件
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Wireshark流量分析助手，擅长：
        1. 分析网络协议
        2. 检测异常流量
        3. 识别攻击模式
        4. 生成分析报告
integration:
  install:
    command: |
      # macOS
      brew install wireshark
      # Linux
      apt-get install wireshark
      # Windows
      # 下载安装包
  config:
    - name: tshark_options
      label: 默认选项
      type: string
      default: "-Y \"http\" -T fields"
  test:
    command: |
      tshark --version
      tshark -i eth0 -c 10
    expect: "tshark"