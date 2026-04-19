---
name: suricata
nameEn: Suricata IDS/IPS
description: 开源入侵检测和防御系统，支持网络流量分析、威胁检测和日志记录
sources:
  product: Suricata
  homepage: https://suricata.io
  api_doc: https://suricata.readthedocs.io/
  github: https://github.com/OISF/suricata
  pricing: 开源免费
  api_type: CLI + Eve JSON

metadata:
  openclaw:
    emoji: "🚨"
    role: IDS
    combination: single
    version: "7.0"
    capabilities:
      light: ["入侵检测", "流量监控", "日志分析"]
      dark: ["威胁狩猎", "攻击检测", "恶意流量分析"]
      security: ["IDS/IPS", "网络监控", "威胁检测"]
      legal: ["合规审计", "取证支持"]
      technology: ["深度包检测", "协议分析"]
      business: ["网络安全态势"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
      - "T1048-Exfiltration"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "AU-Audit and Accountability"
apis:
  suricata_api:
    type: suricata-rest
    baseUrl: "{{suricata_url}}"
    auth:
      type: none
    endpoints:
      - name: getVersion
        path: /info
        method: GET
        description: 获取Suricata版本信息
      - name: getStats
        path: /stats
        method: GET
        description: 获取统计信息
      - name: getAlerts
        path: /alerts
        method: GET
        description: 获取告警列表
      - name: getBlocks
        path: /drop
        method: GET
        description: 获取阻断的流量
      - name: getPcap
        path: /pcap
        method: GET
        description: 下载PCAP文件
prompts:
  monitor:
    - role: system
      content: |
        你是一个专业的Suricata IDS分析助手，擅长：
        1. 分析入侵检测日志
        2. 识别恶意流量
        3. 调查安全告警
        4. 提供防御建议
  hunt:
    - role: system
      content: |
        使用Suricata进行威胁狩猎时，请：
        1. 分析网络流量异常
        2. 检查告警趋势
        3. 识别C2通信
        4. 追踪攻击链
integration:
  install:
    command: |
      # Ubuntu/Debian
      apt-get install suricata
      # Docker
      docker run --rm -it \
        --net=host \
        netsniff/suricata
      # 配置文件
      /etc/suricata/suricata.yaml
  config:
    - name: suricata_url
      label: Suricata API URL
      type: string
      default: "http://localhost:5000"
      required: true
      description: Suricata Update API或EVE JSON接口
  test:
    command: |
      curl -k http://localhost:5000/info
    expect: '"version"