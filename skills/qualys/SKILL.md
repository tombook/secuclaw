---
name: qualys
nameEn: Qualys Cloud Platform
description: 企业漏洞管理和合规平台，支持资产发现、漏洞扫描、合规评估和安全态势管理
sources:
  product: Qualys
  homepage: https://www.qualys.com
  api_doc: https://www.qualys.com/docs/qualys-api.pdf
  pricing: 企业定价
  api_type: REST API

metadata:
  openclaw:
    emoji: "🔍"
    role: VM
    combination: single
    version: "12.5"
    capabilities:
      light: ["漏洞扫描", "资产发现", "合规检查", "态势感知"]
      dark: ["漏洞挖掘", "风险评估", "攻击面分析"]
      security: ["风险评估", "补丁管理", "配置核查"]
      legal: ["合规报告", "等保检查"]
      technology: ["云安全", "容器安全"]
      business: ["风险量化", "合规管理"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  qualys_api:
    type: qualys-rest
    baseUrl: "{{qualys_api_url}}"
    auth:
      type: basicauth
      username: "{{username}}"
      password: "{{password}}"
    endpoints:
      - name: launchScan
        path: /api/2.0/fo/scan/
        method: POST
        description: 启动漏洞扫描
        body: |
          {
            "action": "launch",
            "scan_type": "{{scan_type}}",
            "ip": "{{target_ips}}",
            "priority": "{{priority}}"
          }
      - name: listScans
        path: /api/2.0/fo/scan/
        method: GET
        description: 列出扫描
        params:
          - name: action
            type: string
            default: "list"
      - name: getVulnerabilities
        path: /api/2.0/fo/asset/vm/detection/
        method: GET
        description: 获取漏洞检测
        params:
          - name: action
            type: string
            default: "list"
          - name: ips
            type: string
            required: false
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Qualys漏洞管理助手，擅长：
        1. 执行漏洞扫描
        2. 分析漏洞报告
        3. 评估风险等级
        4. 提供修复建议
  assess:
    - role: system
      content: |
        使用Qualys进行漏洞评估时，请：
        1. 分析漏洞严重性和利用难度
        2. 评估对业务的影响
        3. 制定修复优先级
integration:
  install:
    command: |
      # Qualys是SaaS服务
      # 1. 注册Qualys账户
      # 2. 获取API凭证
      # 3. 安装Cloud Agent (可选)
  config:
    - name: qualys_api_url
      label: Qualys API URL
      type: string
      default: "https://qualysapi.qualys.com"
      required: true
    - name: qualys_user
      label: 用户名
      type: string
      required: true
    - name: qualys_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      curl -k -u "{{username}}:{{password}}" \
        "{{qualys_api_url}}/api/2.0/fo/appliance/?action=list"
    expect: '"PHP"