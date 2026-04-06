import type { RouterDeps } from '../router.js';
import { getReportGenerator, initReportGenerator } from '../../capabilities/report-generator.js';

export function registerReportRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  initReportGenerator(deps.jsonStore);
  const reportGenerator = getReportGenerator();

  handlers.set('reports.listTemplates', async () => {
    const templates = reportGenerator.getTemplates();
    return { data: templates };
  });

  handlers.set('reports.generate', async (params) => {
    const { templateId, reportData, format, generatedBy } = params;
    if (!templateId || !reportData || !format || !generatedBy) {
      throw new Error('templateId, reportData, format, generatedBy required');
    }
    return reportGenerator.generateReport(
      templateId as string,
      reportData as Record<string, unknown>,
      format as any,
      generatedBy as string
    );
  });

  handlers.set('reports.get', async (params) => {
    const { reportId } = params;
    if (!reportId) throw new Error('reportId required');
    return reportGenerator.getReport(reportId as string);
  });

  handlers.set('reports.list', async (params) => {
    const reports = await reportGenerator.listReports({
      type: params.type as any | undefined,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    });
    return { data: reports };
  });

  handlers.set('reports.delete', async (params) => {
    const { reportId } = params;
    if (!reportId) throw new Error('reportId required');
    await reportGenerator.deleteReport(reportId as string);
    return { success: true };
  });
}
