---
name: osquery
nameEn: osquery Endpoint Detection
description: 开源端点可见性工具，使用SQL查询系统状态，支持安全监控和取证分析
sources:
  product: osquery
  homepage: https://osquery.io
  api_doc: https://osquery.readthedocs.io/
  github: https://github.com/osquery/osquery
  pricing: 开源免费
  api_type: CLI + Thrift API

metadata:
  openclaw:
    emoji: "🖥️"
    role: EDR
    combination: single
    version: "5.11"
    capabilities:
      light: ["端点可见性", "配置审计", "进程监控"]
      dark: ["入侵检测", "后门检测", "持久化分析"]
      security: ["系统监控", "安全审计"]
      legal: ["合规审计", "取证分析"]
      technology: ["文件完整性", "注册表监控"]
      business: ["资产发现", "配置管理"]
    mitre_coverage:
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0004-Privilege Escalation"
      - "TA0007-Discovery"
    scf_coverage:
      - "SI-System and Information Integrity"
      - "CM-Configuration Management"
apis:
  osquery_cli:
    type: cli
    command: osqueryi
    options:
      - name: --json
        description: JSON输出
      - name: --csv
        description: CSV输出
      - name: --linq
        description: 使用LINQ语法
prompts:
  query:
    - role: system
      content: |
        你是一个专业的osquery端点分析助手，擅长：
        1. 编写SQL查询端点数据
        2. 检测异常进程和连接
        3. 分析启动项和持久化
        4. 进行数字取证
  hunt:
    - role: system
      content: |
        使用osquery进行威胁狩猎时，请：
        1. 检查异常进程
        2. 分析网络连接
        3. 审查启动项
        4. 检测隐藏文件
integration:
  install:
    command: |
      # macOS
      brew install osquery
      # Linux
      apt-get install osquery
      # Windows
      # 下载.msi安装包
  config:
    - name: osquery_flags
      label: 启动参数
      type: string
      default: "--verbose --json"
  test:
    command: |
      osqueryi --json "SELECT * FROM users LIMIT 5;"
    expect: '"uid"