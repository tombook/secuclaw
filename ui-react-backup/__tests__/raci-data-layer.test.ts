import { describe, it, expect } from 'vitest';
import { raciStore } from '../src/ui/store/raci-store.js';
import { RACI_SCENARIOS, type ScenarioType, type RaciRole } from '../src/ui/config/raci-matrix.js';
import { getWorkflowForRole, getAllWorkflowsForRole, getAllWorkflowsForScenario, type WorkflowStepType } from '../src/ui/config/role-workflow-config.js';
import type { RoleId } from '../src/ui/store/role-context.js';

describe('RACI Data Layer', () => {
  describe('raci-matrix.ts - RACI Matrix Configuration', () => {
    it('should have 5 scenarios defined', () => {
      expect(RACI_SCENARIOS).toHaveLength(5);
    });

    it('should have all required scenario types', () => {
      const scenarioIds = RACI_SCENARIOS.map(s => s.id);
      const expectedScenarios: ScenarioType[] = [
        'incident-response',
        'vulnerability-management',
        'threat-response',
        'compliance-audit',
        'supply-chain-incident'
      ];
      expect(scenarioIds).toEqual(expect.arrayContaining(expectedScenarios));
    });

    it('should have exactly one Accountable role (A) per scenario', () => {
      for (const scenario of RACI_SCENARIOS) {
        const accountable = scenario.assignments.filter(a => a.raci === 'A');
        expect(accountable).toHaveLength(1);
        expect(accountable[0].raci).toBe('A');
      }
    });

    it('should have at least one Responsible role (R) per scenario', () => {
      for (const scenario of RACI_SCENARIOS) {
        const responsible = scenario.assignments.filter(a => a.raci === 'R');
        expect(responsible.length).toBeGreaterThan(0);
      }
    });

    it('should have 8 roles assigned per scenario', () => {
      const allRoles: RoleId[] = [
        'security-expert',
        'privacy-officer',
        'security-architect',
        'business-security-officer',
        'secuclaw-commander',
        'ciso',
        'security-ops',
        'supply-chain-security'
      ];

      for (const scenario of RACI_SCENARIOS) {
        expect(scenario.assignments).toHaveLength(8);
        const assignedRoles = scenario.assignments.map(a => a.role);
        expect(assignedRoles).toEqual(expect.arrayContaining(allRoles));
      }
    });

    it('should have valid RACI values', () => {
      const validRaci: RaciRole[] = ['R', 'A', 'C', 'I'];
      for (const scenario of RACI_SCENARIOS) {
        for (const assignment of scenario.assignments) {
          expect(validRaci).toContain(assignment.raci);
        }
      }
    });

    it('should have non-empty task arrays', () => {
      for (const scenario of RACI_SCENARIOS) {
        for (const assignment of scenario.assignments) {
          expect(assignment.tasks).not.toBeEmpty();
          expect(assignment.tasks.length).toBeGreaterThan(0);
          assignment.tasks.forEach(task => {
            expect(task).toBeTruthy();
            expect(task.length).toBeGreaterThan(0);
          });
        }
      }
    });

    it('should have valid scenario names and descriptions', () => {
      for (const scenario of RACI_SCENARIOS) {
        expect(scenario.name).toBeTruthy();
        expect(scenario.name.length).toBeGreaterThan(0);
        expect(scenario.description).toBeTruthy();
        expect(scenario.description.length).toBeGreaterThan(0);
      }
    });

    it('should have realistic RACI assignments for incident-response', () => {
      const irScenario = RACI_SCENARIOS.find(s => s.id === 'incident-response');
      expect(irScenario).toBeDefined();

      const roles = new Map(irScenario!.assignments.map(a => [a.role, a.raci]));
      
      expect(roles.get('security-ops')).toBe('R');
      expect(roles.get('secuclaw-commander')).toBe('A');
      expect(roles.get('security-expert')).toBe('C');
      expect(roles.get('ciso')).toBe('C');
      expect(roles.get('privacy-officer')).toBe('I');
    });

    it('should have realistic RACI assignments for vulnerability-management', () => {
      const vmScenario = RACI_SCENARIOS.find(s => s.id === 'vulnerability-management');
      expect(vmScenario).toBeDefined();

      const roles = new Map(vmScenario!.assignments.map(a => [a.role, a.raci]));
      
      expect(roles.get('security-expert')).toBe('R');
      expect(roles.get('security-architect')).toBe('R');
      expect(roles.get('ciso')).toBe('A');
    });

    it('should have realistic RACI assignments for threat-response', () => {
      const trScenario = RACI_SCENARIOS.find(s => s.id === 'threat-response');
      expect(trScenario).toBeDefined();

      const roles = new Map(trScenario!.assignments.map(a => [a.role, a.raci]));
      
      expect(roles.get('security-expert')).toBe('R');
      expect(roles.get('security-ops')).toBe('R');
      expect(roles.get('secuclaw-commander')).toBe('A');
    });

    it('should have realistic RACI assignments for compliance-audit', () => {
      const caScenario = RACI_SCENARIOS.find(s => s.id === 'compliance-audit');
      expect(caScenario).toBeDefined();

      const roles = new Map(caScenario!.assignments.map(a => [a.role, a.raci]));
      
      expect(roles.get('privacy-officer')).toBe('R');
      expect(roles.get('ciso')).toBe('A');
      expect(roles.get('security-architect')).toBe('C');
    });

    it('should have realistic RACI assignments for supply-chain-incident', () => {
      const sciScenario = RACI_SCENARIOS.find(s => s.id === 'supply-chain-incident');
      expect(sciScenario).toBeDefined();

      const roles = new Map(sciScenario!.assignments.map(a => [a.role, a.raci]));
      
      expect(roles.get('supply-chain-security')).toBe('R');
      expect(roles.get('security-expert')).toBe('R');
      expect(roles.get('ciso')).toBe('A');
    });
  });

  describe('raci-store.ts - RACI Store', () => {
    it('should initialize with null active scenario', () => {
      expect(raciStore.getActiveScenario()).toBeNull();
    });

    it('should get all scenarios', () => {
      const scenarios = raciStore.getAllScenarios();
      expect(scenarios).toHaveLength(5);
      expect(scenarios[0]).toHaveProperty('id');
      expect(scenarios[0]).toHaveProperty('name');
      expect(scenarios[0]).toHaveProperty('description');
    });

    it('should get specific scenario', () => {
      const scenario = raciStore.getScenario('incident-response');
      expect(scenario).not.toBeNull();
      expect(scenario?.id).toBe('incident-response');
      expect(scenario?.name).toBeTruthy();
    });

    it('should return null for invalid scenario', () => {
      const scenario = raciStore.getScenario('invalid-scenario' as ScenarioType);
      expect(scenario).toBeNull();
    });

    it('should set active scenario', () => {
      raciStore.setActiveScenario('incident-response');
      expect(raciStore.getActiveScenario()).toBe('incident-response');
    });

    it('should throw error for invalid scenario when setting active', () => {
      expect(() => {
        raciStore.setActiveScenario('invalid-scenario' as ScenarioType);
      }).toThrow('Invalid scenario type: invalid-scenario');
    });

    it('should get assignments for a role', () => {
      const assignments = raciStore.getAssignmentsForRole('security-ops');
      expect(assignments).toHaveLength(5);
      expect(assignments[0]).toHaveProperty('scenario');
      expect(assignments[0]).toHaveProperty('scenarioName');
      expect(assignments[0]).toHaveProperty('raci');
      expect(assignments[0]).toHaveProperty('tasks');
    });

    it('should get RACI type for specific role and scenario', () => {
      const raciType = raciStore.getCurrentRaciType('security-ops', 'incident-response');
      expect(raciType).toBe('R');
    });

    it('should return null for invalid role or scenario', () => {
      const raciType = raciStore.getCurrentRaciType('invalid-role' as RoleId, 'incident-response');
      expect(raciType).toBeNull();
    });

    it('should get assignments for a scenario', () => {
      const assignments = raciStore.getAssignmentsForScenario('incident-response');
      expect(assignments).toHaveLength(8);
      expect(assignments[0]).toHaveProperty('role');
      expect(assignments[0]).toHaveProperty('raci');
      expect(assignments[0]).toHaveProperty('tasks');
    });

    it('should get empty array for invalid scenario assignments', () => {
      const assignments = raciStore.getAssignmentsForScenario('invalid-scenario' as ScenarioType);
      expect(assignments).toEqual([]);
    });

    it('should get responsible roles for a scenario', () => {
      const roles = raciStore.getResponsibleRoles('incident-response');
      expect(roles).toContain('security-ops');
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should get accountable role for a scenario', () => {
      const accountable = raciStore.getAccountableRole('incident-response');
      expect(accountable).toBe('secuclaw-commander');
    });

    it('should return null for accountable when invalid scenario', () => {
      const accountable = raciStore.getAccountableRole('invalid-scenario' as ScenarioType);
      expect(accountable).toBeNull();
    });

    it('should get consulted roles for a scenario', () => {
      const roles = raciStore.getConsultedRoles('incident-response');
      expect(roles).toContain('security-expert');
      expect(roles).toContain('ciso');
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should get informed roles for a scenario', () => {
      const roles = raciStore.getInformedRoles('incident-response');
      expect(roles).toContain('privacy-officer');
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should return correct RACI type for security-ops in incident-response', () => {
      const raciType = raciStore.getCurrentRaciType('security-ops', 'incident-response');
      expect(raciType).toBe('R');
    });

    it('should return correct RACI type for secuclaw-commander in incident-response', () => {
      const raciType = raciStore.getCurrentRaciType('secuclaw-commander', 'incident-response');
      expect(raciType).toBe('A');
    });

    it('should return correct RACI type for security-expert in vulnerability-management', () => {
      const raciType = raciStore.getCurrentRaciType('security-expert', 'vulnerability-management');
      expect(raciType).toBe('R');
    });

    it('should return correct RACI type for ciso in vulnerability-management', () => {
      const raciType = raciStore.getCurrentRaciType('ciso', 'vulnerability-management');
      expect(raciType).toBe('A');
    });

    it('should return correct RACI type for privacy-officer in compliance-audit', () => {
      const raciType = raciStore.getCurrentRaciType('privacy-officer', 'compliance-audit');
      expect(raciType).toBe('R');
    });

    it('should return correct RACI type for supply-chain-security in supply-chain-incident', () => {
      const raciType = raciStore.getCurrentRaciType('supply-chain-security', 'supply-chain-incident');
      expect(raciType).toBe('R');
    });
  });

  describe('role-workflow-config.ts - Role Workflow Configuration', () => {
    it('should get workflow for specific role and scenario', () => {
      const steps = getWorkflowForRole('security-ops', 'incident-response');
      expect(steps).not.toBeNull();
      expect(steps.length).toBeGreaterThan(0);
    });

    it('should get empty array for non-existent workflow', () => {
      const steps = getWorkflowForRole('security-expert', 'incident-response');
      expect(steps).toBeInstanceOf(Array);
    });

    it('should get all workflows for a role', () => {
      const workflows = getAllWorkflowsForRole('security-ops');
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0]).toHaveProperty('scenario');
      expect(workflows[0]).toHaveProperty('steps');
    });

    it('should get all workflows for a scenario', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      expect(workflows.length).toBeGreaterThan(0);
      expect(workflows[0]).toHaveProperty('roleId');
      expect(workflows[0]).toHaveProperty('steps');
    });

    it('should have workflow steps with required properties', () => {
      const steps = getWorkflowForRole('security-ops', 'incident-response');
      if (steps.length > 0) {
        const step = steps[0];
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('name');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('type');
      }
    });

    it('should have valid workflow step types', () => {
      const validTypes: WorkflowStepType[] = ['auto', 'manual', 'ai-suggest'];
      
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        workflow.steps.forEach(step => {
          expect(validTypes).toContain(step.type);
        });
      });
    });

    it('should have non-empty step names and descriptions', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        workflow.steps.forEach(step => {
          expect(step.name).toBeTruthy();
          expect(step.name.length).toBeGreaterThan(0);
          expect(step.description).toBeTruthy();
          expect(step.description.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have unique step IDs within a workflow', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        const stepIds = workflow.steps.map(s => s.id);
        const uniqueIds = new Set(stepIds);
        expect(uniqueIds.size).toBe(stepIds.length);
      });
    });

    it('should have valid dependsOn references within workflow', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        const stepIds = new Set(workflow.steps.map(s => s.id));
        workflow.steps.forEach(step => {
          if (step.dependsOn) {
            step.dependsOn.forEach(depId => {
              expect(stepIds.has(depId)).toBe(true);
            });
          }
        });
      });
    });

    it('should have valid notifyRoles values', () => {
      const validRoles: RoleId[] = [
        'security-expert',
        'privacy-officer',
        'security-architect',
        'business-security-officer',
        'secuclaw-commander',
        'ciso',
        'security-ops',
        'supply-chain-security'
      ];

      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        workflow.steps.forEach(step => {
          if (step.notifyRoles) {
            step.notifyRoles.forEach(role => {
              expect(validRoles).toContain(role);
            });
          }
        });
      });
    });

    it('should have at least 3 steps for each workflow', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        expect(workflow.steps.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have workflows for R and A roles in scenarios', () => {
      const scenario = 'incident-response';
      const responsibleRoles = raciStore.getResponsibleRoles(scenario);
      const accountableRole = raciStore.getAccountableRole(scenario);

      responsibleRoles.forEach(role => {
        const workflow = getWorkflowForRole(role, scenario);
        expect(workflow.length).toBeGreaterThan(0);
      });

      if (accountableRole) {
        const workflow = getWorkflowForRole(accountableRole, scenario);
        expect(workflow.length).toBeGreaterThan(0);
      }
    });

    it('should have estimatedDuration for steps where applicable', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        workflow.steps.forEach(step => {
          if (step.estimatedDuration) {
            expect(step.estimatedDuration).toBeTruthy();
            expect(step.estimatedDuration.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should have valid skillId format when provided', () => {
      const workflows = getAllWorkflowsForScenario('incident-response');
      workflows.forEach(workflow => {
        workflow.steps.forEach(step => {
          if (step.skillId) {
            expect(step.skillId).toMatch(/^[a-z0-9-]+$/);
          }
        });
      });
    });
  });
});
