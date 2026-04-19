---
name: palo-alto-ngfw
sources:
  product: Palo Alto NGFW
  homepage: https://www.paloaltonetworks.com
  api_doc: https://docs.paloaltonetworks.com/pan-os/11-0/pan-os-panorama-api
  pricing: 硬件/VM定价
  api_type: REST API + XML API
metadata:
  openclaw:
    emoji: "🔥"
    role: NGFW
    combination: single
    version: "11.0"
    capabilities:
      light: ["防火墙", "威胁防护", "VPN"]
      dark: ["入侵检测", "恶意流量分析"]
      security: ["NGFW", "IDS/IPS", "URL过滤"]
      legal: ["合规审计"]
      technology: ["深度包检测", "SSL解密"]
      business: ["网络分段", "访问控制"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0011-Command and Control"
      - "T1048-Exfiltration"
    scf_coverage:
      - "SI-System and Information Integrity"
apis:
  panorama_api:
    type: pan-os-rest
    baseUrl: "{{panorama_url}}"
    auth:
      type: basicauth
      username: "{{username}}"
      password: "{{password}}"
    endpoints:
      - name: getDevices
        path: /api
        method: GET
        description: 获取设备信息
        params:
          - name: type
            type: string
            default: "device"
          - name: action
            type: string
            default: "show"
            
      - name: getLogs
        path: /api
        method: GET
        description: 获取日志
        params:
          - name: type
            type: string
            default: "log"
          - name: logtype
            type: string
            required: true

prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的Palo Alto防火墙分析助手，擅长：
        1. 分析网络流量日志
        2. 检测威胁事件
        3. 审查安全策略
        4. 生成网络态势报告
  configure:
    - role: system
      content: |
        使用Palo Alto进行配置时，请：
        1. 分析流量模式
        2. 创建安全策略
        3. 配置威胁防护

integration:
  install:
    command: |
      # Palo Alto是硬件/VM系列
      # 1. 访问Web管理界面
      # 2. 配置设备管理
      # 3. 启用API访问
  config:
    - name: panorama_url
      label: Panorama/Device URL
      type: string
      required: true
    - name: pan_user
      label: 用户名
      type: string
      default: "admin"
      required: true
    - name: pan_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      curl -k -X GET "{{panorama_url}}/api/?type=op&cmd=<show><system><info></info></system></show>" \
        -u "{{username}}:{{password}}"
    expect: '"system"
