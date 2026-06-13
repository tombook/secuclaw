import { BillingService } from '../../billing/billing-service.js';
import { NotificationService } from '../../notification/notification-service.js';
import { AuditLogger } from '../../audit/audit-logger.js';
import { DeploymentService } from '../../deployment/deployment-service.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerSaasRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const billing = new BillingService(store);
  const notif = new NotificationService(store);
  const audit = new AuditLogger(store);
  const deploy = new DeploymentService(store);

  handlers.set('saas.billing.plans.init', async () => billing.initializePlans());
  handlers.set('saas.billing.plans.list', async (p: any) => billing.listPlans({ active: p.active, code: p.code }));
  handlers.set('saas.billing.plans.get', async (p: any) => billing.getPlan(p.planId));
  handlers.set('saas.billing.subscription.create', async (p: any) => billing.createSubscription(p.params));
  handlers.set('saas.billing.subscription.cancel', async (p: any) => billing.cancelSubscription(p.subscriptionId, p.immediate));
  handlers.set('saas.billing.subscription.list', async (p: any) => billing.listSubscriptions({ tenantId: p.tenantId, status: p.status, planCode: p.planCode }));
  handlers.set('saas.billing.invoice.create', async (p: any) => billing.createInvoice(p.params));
  handlers.set('saas.billing.invoice.pay', async (p: any) => billing.payInvoice(p.invoiceId, p.paymentMethod, p.paymentReference));
  handlers.set('saas.billing.invoice.list', async (p: any) => billing.listInvoices({ tenantId: p.tenantId, status: p.status, since: p.since, limit: p.limit }));
  handlers.set('saas.billing.usage.record', async (p: any) => billing.recordUsage(p.record));
  handlers.set('saas.billing.usage.get', async (p: any) => billing.getUsage(p.tenantId, p.periodStart, p.periodEnd));
  handlers.set('saas.billing.stats', async () => billing.getStats());

  handlers.set('saas.notification.send', async (p: any) => notif.send(p.params));
  handlers.set('saas.notification.send-bulk', async (p: any) => notif.sendBulk(p.notifications || []));
  handlers.set('saas.notification.get', async (p: any) => notif.getNotification(p.notificationId));
  handlers.set('saas.notification.list', async (p: any) => notif.listNotifications({ tenantId: p.tenantId, channel: p.channel, status: p.status, priority: p.priority, since: p.since, limit: p.limit }));
  handlers.set('saas.notification.preferences.set', async (p: any) => notif.setPreferences(p.params));
  handlers.set('saas.notification.preferences.get', async (p: any) => notif.getPreferences(p.tenantId, p.userId));
  handlers.set('saas.notification.preferences.list', async (p: any) => notif.listPreferences(p.tenantId));
  handlers.set('saas.notification.subscriber.add', async (p: any) => notif.addSubscriber(p.params));
  handlers.set('saas.notification.subscriber.list', async (p: any) => notif.listSubscribers(p.tenantId));
  handlers.set('saas.notification.stats', async (p: any) => notif.getStats(p.since));

  handlers.set('saas.audit.log', async (p: any) => audit.log(p.params));
  handlers.set('saas.audit.query', async (p: any) => audit.query(p.filter || {}));
  handlers.set('saas.audit.verify-chain', async (p: any) => audit.verifyChain(p.tenantId));
  handlers.set('saas.audit.export', async (p: any) => ({ data: await audit.export(p.tenantId, p.format || 'json') }));
  handlers.set('saas.audit.stats', async (p: any) => audit.getStats(p.tenantId));

  handlers.set('saas.deploy.node.register', async (p: any) => deploy.registerNode(p.params));
  handlers.set('saas.deploy.node.metrics', async (p: any) => deploy.updateNodeMetrics(p.params));
  handlers.set('saas.deploy.node.status', async (p: any) => deploy.setNodeStatus(p.nodeId, p.status, p.message || ''));
  handlers.set('saas.deploy.node.list', async (p: any) => deploy.listNodes({ region: p.region, status: p.status, health: p.health }));
  handlers.set('saas.deploy.node.get', async (p: any) => deploy.getNode(p.nodeId));
  handlers.set('saas.deploy.healthcheck.create', async (p: any) => deploy.createHealthCheck(p.params));
  handlers.set('saas.deploy.healthcheck.record', async (p: any) => deploy.recordHealthCheckResult(p.checkId, p.success));
  handlers.set('saas.deploy.healthcheck.list', async (p: any) => deploy.listHealthChecks(p.nodeId));
  handlers.set('saas.deploy.incident.create', async (p: any) => deploy.createIncident(p.params));
  handlers.set('saas.deploy.incident.update', async (p: any) => deploy.updateIncidentStatus(p.incidentId, p.status, p.rootCause, p.remediation));
  handlers.set('saas.deploy.incident.communicate', async (p: any) => deploy.addIncidentCommunication(p.incidentId, p.message, p.channel));
  handlers.set('saas.deploy.incident.list', async (p: any) => deploy.listIncidents({ status: p.status, severity: p.severity, region: p.region, since: p.since, limit: p.limit }));
  handlers.set('saas.deploy.release.start', async (p: any) => deploy.startRelease(p.params));
  handlers.set('saas.deploy.release.complete-node', async (p: any) => deploy.completeReleaseNode(p.releaseId, p.nodeId, p.success));
  handlers.set('saas.deploy.release.rollback', async (p: any) => deploy.rollbackRelease(p.releaseId, p.reason || '', p.rolledBackBy || 'system'));
  handlers.set('saas.deploy.release.list', async (p: any) => deploy.listReleases(p.limit));
  handlers.set('saas.deploy.stats', async () => deploy.getStats());
}
