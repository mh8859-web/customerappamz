

import { ProjectStage } from './types';

export const USER_ROLES = ['Admin', 'Sub-Admin', 'Designer', 'Customer', 'Accounts', 'Project Head', 'Production Head', 'Site Head'];

export const PROJECT_STAGES: ProjectStage[] = [
  'design_phase',
  'material_selection',
  'production_phase',
  'site_work',
  'installation',
  'handover',
  'management_approval',
  'completed'
];

export const STAGE_DISPLAY_NAMES: Record<string, string> = {
    'design_phase': 'Design Phase',
    'material_selection': 'Material Ordering',
    'production_phase': 'Production Phase',
    'site_work': 'Site Execution',
    'installation': 'Installation',
    'handover': 'Final Handover',
    'management_approval': 'Management Approval',
    'completed': 'Project Complete',
};

const DEFAULT_DESC = {
    title: "System Synchronization",
    note: "The project is currently being processed by the management team.",
    action: "Awaiting Next Registry Update."
};

export const STAGE_DESCRIPTIONS: Record<string, { title: string; note: string; action: string }> = {
    'design_phase': {
        title: "Blueprint & Visualization",
        note: "Crafting architectural layouts and high-fidelity renders.",
        action: "Finalizing aesthetic direction."
    },
    'material_selection': {
        title: "Sourcing & Logistics",
        note: "Procuring raw materials and modular components.",
        action: "Inventory verification and vendor lock."
    },
    'production_phase': {
        title: "Factory Processing",
        note: "Custom elements are now in production at the modular facility.",
        action: "Quality checks on raw finishes."
    },
    'site_work': {
        title: "On-Site Execution",
        note: "Civil work and site preparation is active.",
        action: "Daily supervisor site updates."
    },
    'installation': {
        title: "Final Assembly",
        note: "Modular components are being installed on-site.",
        action: "Snag list generation and fitment check."
    },
    'handover': {
        title: "Quality Audit",
        note: "Final cleaning and management handover verification.",
        action: "Issuing completion certificate."
    },
    'management_approval': {
        title: "Executive Review",
        note: "Final project audit by Amaz Management to ensure perfection.",
        action: "Hold for Admin authorization."
    },
    'completed': {
        title: "Welcome Home",
        note: "Vision fully realized. Keys handed to client.",
        action: "Project archived."
    }
};

export const getStageDescription = (stage: string) => STAGE_DESCRIPTIONS[stage] || STAGE_DESCRIPTIONS['design_phase'] || DEFAULT_DESC;

export const AMAZ_SUPPORT_USER_ID = '786786';