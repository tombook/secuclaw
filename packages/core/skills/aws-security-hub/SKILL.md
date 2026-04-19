---
name: aws-security-hub
nameEn: AWS Security Hub
description: AWS云安全态势管理服务，聚合安全告警并进行自动化合规检查
sources:
  product: AWS Security Hub
  homepage: https://aws.amazon.com/security-hub
  api_doc: https://docs.aws.amazon.com/security-hub/
  pricing: 按发现数计费
  api_type: AWS REST API

metadata:
  openclaw:
    emoji: "☁️"
    role: CSPM
    combination: single
    version: "2024"
    capabilities:
      light: ["安全态势", "合规检查", "告警聚合"]
      dark: ["攻击路径分析", "配置风险检测"]
      security: ["CSPM", "CloudTrail分析"]
      legal: ["合规报告", "SOC2", "PCI-DSS"]
      technology: ["AWS安全", "云原生"]
      business: ["风险量化", "合规管理"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0003-Persistence"
      - "TA0006-Credential Access"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  aws_api:
    type: aws-rest
    baseUrl: "https://securityhub.{{region}}.amazonaws.com"
    auth:
      type: aws-sigv4
      region: "{{aws_region}}"
    endpoints:
      - name: getFindings
        path: /v1/Findings
        method: POST
        description: 获取安全发现
        body: |
          {
            "Filters": {
              "Severity": {
                "Value": {{severity}},
                "Comparison": "EQUALS"
              }
            },
            "MaxResults": 100
          }
      - name: getInsights
        path: /v1/Insights
        method: GET
        description: 获取安全洞察
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的AWS Security Hub安全助手，擅长：
        1. 分析AWS安全告警
        2. 发现云配置风险
        3. 评估合规状态
        4. 提供修复建议
  audit:
    - role: system
      content: |
        使用Security Hub进行审计时，请：
        1. 分析安全发现
        2. 检查AWS配置
        3. 评估IAM风险
integration:
  install:
    command: |
      # AWS Security Hub是托管服务
      # 1. 在AWS Console启用Security Hub
      # 2. 配置AWS CLI
      aws configure
      aws securityhub enable --region us-east-1
  config:
    - name: aws_access_key
      label: Access Key
      type: password
      required: true
    - name: aws_secret_key
      label: Secret Key
      type: password
      required: true
    - name: aws_region
      label: Region
      type: string
      default: "us-east-1"
  test:
    command: |
      aws securityhub get-findings --max-items 5
    expect: '"Findings"