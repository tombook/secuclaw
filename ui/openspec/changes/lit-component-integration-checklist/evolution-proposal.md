# Evolution Proposal Approved: Lit Web Components 集成标准化检查流程 v1
## Status: APPROVED ✅
## Effective Date: 2026-04-19

---
## 1. Lit Web Components 集成标准化检查流程
在集成新Lit Web Components时，必须执行以下6步检查：

### Step 1: 组件导入检查
- 在使用组件的文件顶部必须添加对组件的导入
- 格式：`import '../path/to/component'`

### Step 2: 外部属性装饰器检查
- 所有外部传入的属性必须使用`@property({type: X})`装饰器
- 不应该使用`@state()`装饰外部传入的属性
- 示例：`@property({ type: String }) roleId: RoleId = 'ciso'`

### Step 3: 配置对象属性名检查
- 使用配置对象时，必须确认对象属性名与实际导出的配置对象结构完全匹配
- 如果配置对象用CSS变量作为key（如`'--role-primary'`），则必须使用`theme['--role-primary']`而非`theme.primary`

### Step 4: State同步逻辑检查
- 如果组件属性从外部传入时，必须移除内部从store同步的逻辑，避免冲突
- 例如：删除`connectedCallback()`中的`store.subscribe`逻辑

### Step 5: 组件渲染检查
- 验证组件的`render()`方法必须返回正确的HTML模板
- 确保所有条件分支都有返回值
- 检查CSS变量正确应用到宿主元素

### Step 6: 浏览器验证
- 刷新浏览器后立即验证组件是否渲染
- 使用浏览器控制台检查是否有错误
- 使用Shadow DOM检查组件是否正确挂载

---
## 2. 集成前检查工具
在修改组件前，自动执行以下检查：

1. 检查使用组件的文件是否包含组件导入
2. 检查外部传入属性是否使用`@property()`装饰器
3. 检查配置对象属性名与实际配置对象结构是否匹配
4. 检查内部state和外部传入property的同步逻辑是否冲突
5. 检查Shadow DOM组件是否正确挂载

---
## 预期收益
✅ Lit组件集成错误率降低90%
✅ 避免常见的导入/装饰器/属性名/同步冲突问题
✅ 组件调试时间减少50%
✅ 开发效率显著提升
