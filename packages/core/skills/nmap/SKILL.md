---
name: nmap
nameEn: Nmap Network Scanner
description: 业界领先的端口扫描和网络发现工具，支持服务检测、OS指纹识别和漏洞扫描
sources:
  product: Nmap
  homepage: https://nmap.org
  api_doc: https://nmap.org/book/man.html
  github: https://github.com/nmap/nmap
  pricing: 开源免费
  api_type: CLI工具

metadata:
  openclaw:
    emoji: "🔍"
    role: RECON
    combination: single
    version: "7.94"
    capabilities:
      light: ["端口扫描", "服务检测", "OS识别", "网络发现"]
      dark: ["渗透侦察", "攻击面发现", "漏洞探测"]
      security: ["渗透测试", "安全评估", "资产发现"]
      legal: ["渗透测试授权"]
      technology: ["网络扫描", "TCP/IP"]
      business: ["资产梳理", "攻击面评估"]
    mitre_coverage:
      - "TA0007-Discovery"
      - "T1046-Network Service Scanning"
      - "TA0013-Scanning"
    scf_coverage:
      - "RA-Risk Assessment"
      - "SI-System and Information Integrity"
apis:
  nmap_cli:
    type: cli
    command: nmap
    install: |
      # macOS
      brew install nmap
      # Linux (Debian/Ubuntu)
      apt-get install nmap
      # Windows
      # 下载: https://nmap.org/download.html
      # Kali Linux
      # 已预装
    options:
      - name: -sS
        description: SYN扫描 (快速,需要root)
        category: scan_type
      - name: -sT
        description: TCP连接扫描 (不需要root)
        category: scan_type
      - name: -sU
        description: UDP扫描 (慢,需要root)
        category: scan_type
      - name: -sV
        description: 版本检测
        category: detection
      - name: -O
        description: OS检测
        category: detection
      - name: -A
        description: 高级扫描 (OS+版本+脚本+路由)
        category: detection
      - name: -p
        description: 端口范围 (如: 22,80,443,1000-2000)
        category: port
      - name: -oX
        description: XML输出
        category: output
      - name: -oJ
        description: JSON输出
        category: output
      - name: --script
        description: 使用NSE脚本 (如: vulners,discovery,auth)
        category: script
      - name: -Pn
        description: 跳过Ping检测
        category: options
      - name: -T4
        description: 速度等级 (T0-T5)
        category: options
      - name: -iL
        description: 从文件读取目标列表
        category: input
      - name: --top-ports
        description: 扫描最常见的端口
        category: port
    examples:
      - name: 基础端口扫描
        command: nmap -sT -p 22,80,443 192.168.1.0/24
      - name: SYN扫描 (需要root)
        command: nmap -sS -p- -T4 -oX scan.xml 10.0.0.0/24
      - name: 服务版本检测
        command: nmap -sV -p 1-1000 --script default 192.168.1.1
      - name: 漏洞扫描
        command: nmap --script vuln -p- target.example.com
      - name: JSON输出扫描
        command: nmap -sV -oJ scan.json -p 22,80,443,3306,5432 192.168.1.0/24
    output_formats:
      normal: "人类可读的输出到stdout"
      xml: "XML格式,便于程序解析"
      json: "JSON格式,便于API集成"
      grepable: "便于grep的格式"
prompts:
  scan:
    - role: system
      content: |
        你是一个专业的Nmap网络扫描助手，擅长：
        1. 执行各类端口扫描
        2. 进行服务指纹识别
        3. 发现潜在漏洞
        4. 分析网络拓扑
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析Nmap扫描结果时，请提供：
        1. 开放端口列表
        2. 运行服务识别
        3. 安全风险评估
        4. 加固建议
integration:
  install:
    command: |
      # macOS
      brew install nmap
      # Linux
      apt-get install nmap
      # Windows
      # https://nmap.org/download.html
  config:
    - name: default_scan_type
      label: 默认扫描类型
      type: select
      options: ["-sS (SYN)", "-sT (TCP)", "-sU (UDP)"]
      default: "-sT"
    - name: default_ports
      label: 默认端口
      type: string
      default: "21,22,23,25,80,443,3306,3389,5432,6379,8080,8443"
    - name: nmap_scripts
      label: NSE脚本类别
      type: string
      default: "default,safe,vuln"
  test:
    command: nmap --version
    expect: "Nmap version"
outputs:
  report:
    format: [text, json, xml, markdown]
    template: |
      # Nmap 安全扫描报告
      ## 目标信息
      - 目标: {{target}}
      - 扫描时间: {{scan_time}}
      - 扫描类型: {{scan_type}}
      ## 开放端口统计
      | 端口 | 服务 | 版本 | 风险 |
      |------|------|------|------|
      {{open_ports}}
      ## 安全风险
      {{security_findings}}
      ## 加固建议
      {{recommendations}}
---
# Nmap 技能使用指南
## 功能概述
Nmap ("Network Mapper") 是业界领先的开源网络发现和安全审计工具：
- **端口扫描**: 发现开放端口
- **服务检测**: 识别运行的服务和版本
- **OS检测**: 识别操作系统
- **脚本扫描**: NSE脚本进行漏洞检测
- **路由追踪**: 发现网络路径
## 快速开始
### 基本扫描
```bash
# 扫描单个主机
nmap 192.168.1.1
# 扫描网段
nmap 192.168.1.0/24
# 扫描多个主机
nmap 192.168.1.1 192.168.1.10 192.168.1.20
# 从文件读取目标
nmap -iL targets.txt
```
### 端口指定
```bash
# 扫描特定端口
nmap -p 80,443 192.168.1.1
# 扫描端口范围
nmap -p 1-1000 192.168.1.1
# 扫描所有端口
nmap -p- 192.168.1.1
# 扫描常见端口
nmap --top-ports 100 192.168.1.1
```
### 扫描类型
| 选项 | 类型 | 说明 | 需要root |
|------|------|------|----------|
| -sS | SYN扫描 | 快速,隐蔽 | 是 |
| -sT | TCP扫描 | 完整连接 | 否 |
| -sU | UDP扫描 | 慢,但全面 | 是 |
| -sP | Ping扫描 | 只发现主机 | 否 |
| -sV | 版本检测 | 识别服务版本 | 否 |
### 输出格式
```bash
# 标准输出 (默认)
nmap 192.168.1.1
# XML输出 (便于程序处理)
nmap -oX scan.xml 192.168.1.1
# JSON输出 (便于API集成)
nmap -oJ scan.json 192.168.1.1
# Grepable输出 (便于grep)
nmap -oG scan.gnmap 192.168.1.1
# 保存所有格式
nmap -oA scan 192.168.1.1
```
## NSE脚本
Nmap Scripting Engine (NSE) 提供强大扩展能力：
```bash
# 运行默认脚本
nmap -sC 192.168.1.1
# 运行漏洞脚本
nmap --script vuln 192.168.1.1
# 运行特定脚本
nmap --script http-enum,http-title 192.168.1.1
# 使用vulners脚本 (需要vulners.nse)
nmap --script vulners -sV 192.168.1.1
```
常用脚本类别：
- `auth`: 认证相关
- `broadcast`: 广播探测
- `brute`: 暴力破解
- `default`: 默认脚本
- `discovery`: 服务发现
- `exploit`: 漏洞利用
- `external`: 外部查询
- `fuzzer`: 模糊测试
- `intrusive`: 入侵性脚本
- `malware`: 恶意软件检测
- `safe`: 安全脚本
- `version`: 版本检测
- `vuln`: 漏洞检测
## 使用示例
### 智能扫描对话
```
用户: 扫描 192.168.1.0/24 网段
助手:
🔍 **Nmap 网络扫描**
目标: 192.168.1.0/24 (256个地址)
扫描类型: SYN扫描
端口: 常见端口 (1-1000)
开始时间: 2026-03-31 09:30:00
⏱️ 扫描中... 发现 23 台在线主机
📊 **扫描完成**
**发现的服务:**
| IP | 主机名 | 开放端口 | 服务 |
|----|--------|----------|------|
| 192.168.1.1 | router.local | 80,443 | Web管理 |
| 192.168.1.10 | server01 | 22,80,443,3306 | SSH,HTTP,MySQL |
| 192.168.1.15 | workstation | 445,3389 | SMB,RDP |
| 192.168.1.20 | printer | 80,631,9100 | HP打印服务 |
⚠️ **安全风险:**
1. **高危**: 192.168.1.10 开放MySQL (3306) 到内网
2. **中危**: 192.168.1.15 开放RDP (3389)
3. **低危**: 打印机开放多个服务
📋 **加固建议:**
1. MySQL应限制仅本地访问
2. RDP建议使用VPN或限制IP
3. 打印机考虑网络隔离
```
## 与其他工具集成
```bash
# 导入到Nessus
nmap -oX scan.xml 192.168.1.0/24
# 然后导入到Nessus进行漏洞扫描
# 配合Metasploit使用
nmap -oX scan.xml 192.168.1.0/24
msfconsole
db_import scan.xml
# 在Metasploit中搜索相关exploit
# 使用grep快速筛选
nmap -oG scan.gnmap 192.168.1.0/24
grep "22/open" scan.gnmap  # 找开SSH的机器
grep "80/open" scan.gnmap  # 找开HTTP的机器
```