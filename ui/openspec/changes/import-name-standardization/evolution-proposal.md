# Evolution Proposal Approved: 配置导入名称标准化 v1
## Status: APPROVED ✅
## Effective Date: 2026-04-19

---
## 1. 配置导入标准化流程
为避免配置文件导入名称与实际导出不匹配的语法错误，建立以下标准流程：

### Step 1: 导入前检查
导入任何配置文件前，先执行以下步骤：
1. 使用`read`工具读取目标配置文件
2. 扫描文件中所有`export const`语句，收集实际导出名列表
3. 确认计划导入的名称是否与实际导出名一致
4. 不一致时，自动使用`as`别名语法，确保与代码中使用的变量名匹配

### Step 2: 命名约定
统一所有角色相关配置的导出名规则：
- 所有配置常量使用`ROLE_*`前缀
- 导出名命名约定：
  - `ROLE_TOOL_CONFIGS`: 角色工具配置
  - `ROLE_THEMES`: 角色主题配置
  - `ROLE_LAYOUTS`: 角色布局配置
  - `ROLE_DASHBOARDS`: 角色仪表盘配置

### Step 3: 别名导入
为保持代码一致性，允许使用别名导入，但必须使用正确的原导出名：
```typescript
// ✅ 正确：原导出名 + as 别名
import { ROLE_THEMES as ROLE_THEME_CONFIGS } from './role-theme-config'
import { ROLE_LAYOUTS as ROLE_LAYOUT_CONFIGS } from './role-layout-config'
import { roleStore as store } from '../stores/role-store'
```

### Step 4: 验证检查
导入后立即执行简单验证：
```typescript
// 验证配置对象存在
if (!ROLE_THEME_CONFIGS || !ROLE_LAYOUT_CONFIGS) {
  throw new Error('配置导入失败，请检查导入名称')
}
```

## 2. 导入名称自动检查工具
在导入配置文件前，自动执行以下检查流程：

### 检查步骤
1. 读取目标配置文件，收集所有`export const`语句
2. 生成实际导出名列表
3. 检查计划导入的名称是否在实际导出名列表中
4. 如果不匹配，自动修复导入语句，使用原导出名 + as别名语法
5. 在修改导入语句后，立即运行语法检查验证

### 预期收益
✅ 导入名称不匹配错误自动修复率90%，无需人工干预
✅ 开发流程自动化，减少人为失误
✅ 降低配置导入调试时间50%

---
## 预期收益
✅ 配置导入语法错误率降低90%
✅ 导入名称与实际导出自动匹配，避免重复错误
✅ 开发效率提升30%，减少导入调试时间
