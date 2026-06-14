/**
 * Access 模块统一导出
 */
export * from './types.js';
export * from './plan-registry.js';
export * from './role-registry.js';
export {
  CAPABILITY_REQUIREMENTS,
  evaluateCapability,
  evaluateAllCapabilities,
  CapabilityActivationStore,
  activationStore,
  buildDataSignals,
} from './capability-activator.js';
export {
  featureFlagStore,
  initDefaultFlags,
  evaluateFlag,
  computeUserBucket,
  createFlag,
  toggleFlag,
} from './feature-flag-service.js';
export {
  checkAccess,
  getAccessibleMenu,
  buildDevContext,
  type AccessRequest,
  type AccessResponse,
  type MenuItem,
} from './access-control.js';
