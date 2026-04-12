/**
 * SecuClaw Data Resource Center - 数据资源中心
 * 
 * 包含:
 * - 16个核心数据库管理页面
 * - 数据血缘关系可视化
 * - 数据质量监控
 */

// Re-export from the central store
export { dataStore } from '../store/data-store.js';
export type { DatabaseInfo, DatabaseHealth, DatabaseType, LineageGraph, LineageNode, LineageRelation, QualityIssue, DataSource } from '../store/data-store.js';
