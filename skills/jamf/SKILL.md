---
name: jamf
nameEn: Jamf macOS Management
description: Apple设备管理平台，支持macOS/iOS设备安全管理、合规检查和威胁检测
sources:
  product: Jamf
  homepage: https://www.jamf.com
  api_doc: https://developer.jamf.com/
  pricing: $4/设备/月起
  api_type: REST API

metadata:
  openclaw:
    emoji: "🍎"
    role: MDM
    combination: single
    version: "10.5"
    capabilities:
      light: ["设备管理", "合规检查", "软件分发"]
      dark: ["恶意软件检测", "入侵分析"]
      security: ["MDM", "端点安全"]
      legal: ["合规审计"]
      technology: ["Apple设备管理"]
      business: ["资产管理"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0007-Discovery"
    scf_coverage:
      - "CM-Configuration Management"
apis:
  jamf_api:
    type: jamf-rest
    baseUrl: "{{jamf_url}}/JSSResource"
    auth:
      type: basicauth
      username: "{{username}}"
      password: "{{password}}"
    endpoints:
      - name: getComputers
        path: /computers
        method: GET
        description: 获取计算机列表
      - name: getComputerDetail
        path: /computers/id/{id}
        method: GET
        description: 获取计算机详情
      - name: getLogs
        path: /computerextensions/parameters
        method: GET
        description: 获取日志
prompts:
  manage:
    - role: system
      content: |
        你是一个专业的Jamf Apple设备管理助手，擅长：
        1. 管理macOS设备
        2. 检查安全合规
        3. 检测异常活动
        4. 生成设备报告
integration:
  install:
    command: |
      # Jamf是SaaS服务
      # 1. 订阅Jamf Pro
      # 2. 配置MDM配置文件
      # 3. 获取API凭证
  config:
    - name: jamf_url
      label: Jamf URL
      type: string
      required: true
    - name: jamf_user
      label: 用户名
      type: string
      required: true
    - name: jamf_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      curl -k -u "{{jamf_user}}:{{jamf_password}}" \
        "{{jamf_url}}/JSSResource/computers"
    expect: '"computers"