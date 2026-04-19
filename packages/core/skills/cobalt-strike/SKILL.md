---
name: cobalt-strike
nameEn: Cobalt Strike
description: 渗透测试平台，支持红队演练、社会工程和APT模拟
sources:
  product: Cobalt Strike
  homepage: https://www.cobaltstrike.com
  api_doc: https://www.cobaltstrike.com/documentation
  pricing: $3,500/年
  api_type: Aggressor Script + REST API

metadata:
  openclaw:
    emoji: "🔴"
    role: REDTEAM
    combination: single
    version: "4.9"
    capabilities:
      light: ["渗透测试", "红队演练"]
      dark: ["APT模拟", "横向移动", "权限维持"]
      security: ["攻击模拟", "防御测试"]
      legal: ["渗透测试授权"]
      technology: ["Metasploit", "Beacon"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  cobalt_api:
    type: cobalt-rest
    baseUrl: "{{cobalt_url}}/api"
    auth:
      type: cobalt-token
      header: "Authorization"
      format: "Bearer {{cobalt_token}}"
    endpoints:
      - name: getTargets
        path: /targets
        method: GET
        description: 获取目标列表
      - name: getReports
        path: /reports
        method: GET
        description: 获取报告
prompts:
  redteam:
    - role: system
      content: |
        你是一个专业的Cobalt Strike红队助手，擅长：
        1. 规划和执行红队演练
        2. 使用Beacon进行后渗透
        3. 模拟APT攻击
        4. 生成红队报告
integration:
  install:
    command: |
      # Cobalt Strike是商业软件
      # 需要有效的许可证
      # 1. 下载Cobalt Strike
      # 2. 配置teamserver
      ./teamserver <host> <password>
  config:
    - name: cobalt_url
      label: Cobalt Strike URL
      type: string
      default: "https://localhost:50050"
      required: true
    - name: cobalt_user
      label: 用户名
      type: string
      default: "user"
      required: true
    - name: cobalt_password
      label: 密码
      type: password
      required: true
  test:
    command: |
      # 使用Aggressor脚本测试连接
      curl -k -u "{{cobalt_user}}:{{cobalt_password}}" \
        "{{cobalt_url}}/api/status"
    expect: '"status"