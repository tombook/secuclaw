## Why

SecuClaw需要一个统一的AI安全专家页面,驱动项目各功能。该页面展示8种安全角色,每种角色配备独特的技能组合,通过SKILL.md格式定义角色能力、MITRE ATT&CK战术覆盖和SCF控制框架覆盖。

## What Changes

### AI安全专家页面
- 创建`sc-ai-experts-page.ts`页面组件
- 左侧面板显示8种安全角色卡片
- 右侧面板显示技能详情和聊天界面
- 支持技能(Skills)和聊天(Chat)两个标签页

### 8种安全角色
1. **安全专家** (security-expert) - Vulnerability management 🛡️
2. **隐私安全官** (privacy-officer) - Privacy compliance 🔐
3. **安全架构师** (security-architect) - Security architecture 🏗️
4. **业务安全官** (business-security-officer) - Business continuity 📊
5. **全域安全指挥官** (secuclaw-commander) - Full-spectrum command 🎯
6. **首席信息安全官** (ciso) - Security strategy 👔
7. **安全运营官** (security-ops) - SOC operations ⚙️
8. **供应链安全官** (supply-chain-security) - Vendor security 🔗

### 技能分类
每个角色具备6个技能维度:
- **Light (光明面)** - 防御性技能
- **Dark (黑暗面)** - 攻击性技能
- **Security** - 安全技术技能
- **Legal** - 法律合规技能
- **Technology** - 技术架构技能
- **Business** - 业务管理技能

### 技能定义格式
使用`skills/{role-id}/SKILL.md`定义角色,包含:
- 基础信息 (name, description, homepage)
- 元数据 (emoji, role, combination, version)
- 能力矩阵 (capabilities)
- MITRE ATT&CK覆盖
- SCF控制框架覆盖
- 可视化配置

## Capabilities

### New Capabilities
- `ai-security-experts`: AI安全专家页面和角色系统

### Modified Capabilities
- (无)

## Impact

- `ui/src/ui/pages/sc-ai-experts-page.ts` - AI专家页面组件
- `ui/src/ui/store/skill-store.ts` - 技能状态管理
- `ui/src/ui/gateway-client.ts` - WebSocket客户端
- `skills/security-expert/SKILL.md` - 安全专家技能定义
- `skills/privacy-officer/SKILL.md` - 隐私安全官技能定义
- `skills/security-architect/SKILL.md` - 安全架构师技能定义
- `skills/business-security-officer/SKILL.md` - 业务安全官技能定义
- `skills/secuclaw-commander/SKILL.md` - 全域安全指挥官技能定义
- `skills/ciso/SKILL.md` - 首席信息安全官技能定义
- `skills/security-ops/SKILL.md` - 安全运营官技能定义
- `skills/supply-chain-security/SKILL.md` - 供应链安全官技能定义
- `packages/core/src/skills/loader.ts` - 技能加载器