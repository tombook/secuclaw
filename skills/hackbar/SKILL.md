---
name: hackbar
nameEn: Hackbar
description: Web渗透测试辅助工具，支持SQL注入和XSS测试
sources:
  product: HackBar
  homepage: https://github.com/Ph02nix/HackBar
  api_doc: https://github.com/Ph02nix/HackBar
  github: https://github.com/Ph02nix/HackBar
  pricing: 开源免费
  api_type: 浏览器扩展

metadata:
  openclaw:
    emoji: "🔧"
    role: WEB
    combination: single
    version: "2.3"
    capabilities:
      light: ["安全测试", "开发辅助"]
      dark: ["渗透测试"]
      security: ["Web安全"]
      legal: ["渗透测试授权"]
      technology: ["Web开发"]
      business: ["安全评估"]
    mitre_coverage:
      - "TA0001-Initial Access"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  hackbar_extension:
    type: browser-extension
    install: |
      # Firefox: 附加组件商店搜索HackBar
      # Chrome: Chrome商店搜索HackBar
prompts:
  test:
    - role: system
      content: |
        你是一个专业的HackBar Web安全助手，擅长：
        1. 执行SQL注入测试
        2. 测试XSS漏洞
        3. 编码/解码数据
integration:
  install:
    command: |
      # Firefox
      # https://addons.mozilla.org/en-US/firefox/addon/hackbartwo/
      # Chrome
      # https://chrome.google.com/webstore
  config:
    - name: hackbar_usage
      label: 使用说明
      type: string
      default: "SQL注入、XSS测试、编码解码"
  test:
    command: |
      # 浏览器扩展，无需命令行
      # 访问附加组件页面安装
    expect: "HackBar"