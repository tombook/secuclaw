import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { RACI_SCENARIOS } from '@/config/raci-matrix';
import type { RaciRole, ScenarioType } from '@/config/raci-matrix';
import { ROLE_THEMES } from '@/config/role-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/* ── Types ── */
interface TaskItem {
  title: string;
  description: string;
  scenario: string;
  status: 'pending' | 'in-progress' | 'done';
}

/* ── Helpers ── */
const RACI_CONFIG: Record<RaciRole, { color: string; label: string; desc: string; actionLabel: string }> = {
  R: { color: '#3b82f6', label: 'R 负责执行', desc: '需要你亲自执行的任务', actionLabel: '执行' },
  A: { color: '#ef4444', label: 'A 最终审批', desc: '需要你做出决策的事项', actionLabel: '审批' },
  C: { color: '#22c55e', label: 'C 咨询建议', desc: '需要你提供专业意见', actionLabel: '回复' },
  I: { color: '#f59e0b', label: 'I 知会同步', desc: '需要你知晓的信息', actionLabel: '确认' },
};

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-white/30',
  'in-progress': 'bg-blue-400 animate-pulse',
  done: 'bg-green-400',
};

export const RaciTaskSection: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const [expanded, setExpanded] = useState<RaciRole | null>(null);

  if (!currentRole) return null;
  const theme = ROLE_THEMES[currentRole];

  // Aggregate tasks by RACI type
  const raciGroups: Record<RaciRole, TaskItem[]> = { R: [], A: [], C: [], I: [] };

  RACI_SCENARIOS.forEach((scenario) => {
    const assignment = scenario.assignments.find((a) => a.role === currentRole);
    if (!assignment) return;
    const role = assignment.raci;
    assignment.tasks.forEach((task, idx) => {
      raciGroups[role].push({
        title: task,
        description: scenario.description,
        scenario: scenario.name,
        status: idx === 0 ? 'in-progress' : idx < 2 ? 'pending' : 'done',
      });
    });
  });

  const raciTypes: RaciRole[] = ['R', 'A', 'C', 'I'];

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme.colors.textSecondary }}>
        RACI 任务区
      </h3>

      {/* 4 cards row */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {raciTypes.map((type) => {
          const cfg = RACI_CONFIG[type];
          const tasks = raciGroups[type];
          const isExpanded = expanded === type;

          return (
            <div key={type}>
              <button
                onClick={() => setExpanded(isExpanded ? null : type)}
                className="w-full text-left rounded-lg p-3 transition-all duration-200 hover:brightness-125"
                style={{
                  backgroundColor: '#0f1525',
                  borderLeft: `3px solid ${cfg.color}`,
                  boxShadow: isExpanded ? `0 0 12px ${cfg.color}22` : 'none',
                }}
              >
                <Badge
                  className="text-[10px] mb-2 border-0"
                  style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                >
                  {cfg.label}
                </Badge>
                <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>{tasks.length}</div>
                <div className="text-[11px] mt-0.5" style={{ color: theme.colors.textSecondary }}>{cfg.desc}</div>
              </button>

              {/* Expanded task list */}
              {isExpanded && tasks.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="rounded-md p-2.5 flex items-start gap-2 transition-colors hover:bg-white/5"
                      style={{ backgroundColor: '#0f1525' }}
                    >
                      {/* Status dot */}
                      <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[task.status]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{task.title}</div>
                        <div className="text-[10px] text-white/40 truncate">{task.description}</div>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[9px] px-1.5 py-0 border-white/10 text-white/50"
                        >
                          {task.scenario}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[10px] h-6 px-2 flex-shrink-0 hover:bg-white/10"
                        style={{ color: cfg.color }}
                      >
                        {cfg.actionLabel}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RaciTaskSection;
