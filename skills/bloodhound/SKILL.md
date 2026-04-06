---
name: bloodhound
nameEn: BloodHound AD Analysis
description: Active Directory攻击路径分析工具，使用图论发现域渗透路径
sources:
  product: BloodHound
  homepage: https://github.com/BloodHoundAD
  api_doc: https://bloodhound.readthedocs.io/
  github: https://github.com/BloodHoundAD/BloodHound
  pricing: 开源免费
  api_type: CLI + Neo4j

metadata:
  openclaw:
    emoji: "🩸"
    role: AD
    combination: single
    version: "4.3"
    capabilities:
      light: ["AD分析", "攻击路径发现"]
      dark: ["域渗透", "权限提升", "横向移动"]
      security: ["AD安全", "攻击路径分析"]
      legal: ["渗透测试授权"]
      technology: ["图论分析", "LDAP查询"]
      business: ["AD安全评估"]
    mitre_coverage:
      - "TA0004-Privilege Escalation"
      - "TA0008-Lateral Movement"
      - "T1098-Account Manipulation"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  bloodhound_cli:
    type: cli
    command: bloodhound
    options:
      - name: -c
        description: 收集器类型
      - name: -u
        description: 用户名
      - name: -p
        description: 密码
prompts:
  analyze:
    - role: system
      content: |
        你是一个专业的BloodHound AD分析助手，擅长：
        1. 分析AD攻击路径
        2. 发现域提权路径
        3. 评估域安全
        4. 生成攻击路径报告
integration:
  install:
    command: |
      # Docker
      docker run -d --name bloodhound \
        -p 7474:7474 -p 7687:7687 \
        bloodhoundce/bloodhound:latest
      # 收集器
      pip install bloodhound
  config:
    - name: bloodhound_neo4j
      label: Neo4j URL
      type: string
      default: "bolt://localhost:7687"
  test:
    command: |
      bloodhound --version
    expect: "BloodHound"