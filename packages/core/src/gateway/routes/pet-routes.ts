import { PrivacyEnhancementService } from '../../privacy/privacy-enhancement-service.js';
import type { JsonStore } from '../../storage/json-store.js';
import type { RouterDeps } from '../router.js';


export function registerPrivacyEnhancementRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const service = new PrivacyEnhancementService(deps.jsonStore as JsonStore);
  void service.initialize();

  handlers.set('privacy.classify.data', async (params: Record<string, unknown>) => {
    const data = (params.data as Record<string, unknown>) ?? {};
    return service.classifyData(data);
  });

  handlers.set('privacy.classify.field', async (params: Record<string, unknown>) => {
    const fieldName = params.fieldName as string;
    const value = params.value;
    return service.classifyField(fieldName, value);
  });

  handlers.set('privacy.anonymize.data', async (params: Record<string, unknown>) => {
    const data = (params.data as Record<string, unknown>) ?? {};
    const method = params.method as 'masking' | 'pseudonymization' | 'generalization' | 'differential_privacy' | 'tokenization' | 'suppression' | undefined;
    return service.anonymizeData(data, method);
  });

  handlers.set('privacy.anonymize.field', async (params: Record<string, unknown>) => {
    const value = params.value as string;
    const piiCategory = params.piiCategory as 'name' | 'email' | 'phone' | 'address' | 'ssn' | 'credit_card' | 'passport' | 'date_of_birth' | 'medical' | 'biometric' | 'financial' | 'location' | 'ip_address' | 'device_id' | 'other';
    const method = params.method as 'masking' | 'pseudonymization' | 'generalization' | 'differential_privacy' | 'tokenization' | 'suppression' | undefined;
    return service.anonymizeField(value, piiCategory, method);
  });

  handlers.set('privacy.dp.noise', async (params: Record<string, unknown>) => {
    const value = params.value as number;
    const epsilon = params.epsilon as number;
    const noisyValue = service.addNoise(value, epsilon);
    return { noisyValue };
  });

  handlers.set('privacy.dsar.create', async (params: Record<string, unknown>) => {
    return service.createDsarRequest({
      type: params.type as 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction' | 'objection',
      dataSubjectName: params.dataSubjectName as string,
      dataSubjectEmail: params.dataSubjectEmail as string,
      dataSubjectId: params.dataSubjectId as string,
      description: params.description as string,
    });
  });

  handlers.set('privacy.dsar.verify', async (params: Record<string, unknown>) => {
    return service.verifyDsarRequest(params.requestId as string);
  });

  handlers.set('privacy.dsar.process', async (params: Record<string, unknown>) => {
    return service.processDsarRequest(params.requestId as string);
  });

  handlers.set('privacy.dsar.complete', async (params: Record<string, unknown>) => {
    return service.completeDsarRequest(
      params.requestId as string,
      (params.findings as any[]) ?? [],
      (params.documents as any[]) ?? [],
    );
  });

  handlers.set('privacy.dsar.list', async (params: Record<string, unknown>) => {
    return service.listDsarRequests({
      type: params.type as 'access' | 'deletion' | 'portability' | 'rectification' | 'restriction' | 'objection' | undefined,
      status: params.status as 'received' | 'verified' | 'in_progress' | 'completed' | 'rejected' | 'expired' | undefined,
    });
  });

  handlers.set('privacy.dsar.get', async (params: Record<string, unknown>) => {
    return service.getDsarRequest(params.requestId as string);
  });

  handlers.set('privacy.dsar.overdue', async () => {
    return service.getOverdueDsarRequests();
  });

  handlers.set('privacy.retention.rules.add', async (params: Record<string, unknown>) => {
    return service.addRetentionRule({
      dataType: params.dataType as string,
      category: params.category as 'name' | 'email' | 'phone' | 'address' | 'ssn' | 'credit_card' | 'passport' | 'date_of_birth' | 'medical' | 'biometric' | 'financial' | 'location' | 'ip_address' | 'device_id' | 'other',
      policy: params.policy as 'delete' | 'archive' | 'anonymize' | 'review',
      retentionDays: params.retentionDays as number,
      legalBasis: params.legalBasis as string,
      autoExecute: params.autoExecute as boolean,
    });
  });

  handlers.set('privacy.retention.rules.list', async () => {
    return service.listRetentionRules();
  });

  handlers.set('privacy.retention.rules.get', async (params: Record<string, unknown>) => {
    return service.getRetentionRule(params.ruleId as string);
  });

  handlers.set('privacy.retention.execute', async () => {
    return service.executeRetention();
  });

  handlers.set('privacy.dashboard', async () => {
    return service.getPrivacyDashboard();
  });
}
