
import { ProjectStage } from './types';

export const USER_ROLES = ['Admin', 'Sub-Admin', 'Designer', 'Customer', 'Accounts', 'Project Head', 'Production Head', 'Site Head'];

export const PROJECT_STAGES: ProjectStage[] = [
  'Design',
  'Material Ordering',
  'Production',
  'Site Work',
  'Installation',
  'Handover',
  'Completed'
];

export const STAGE_DISPLAY_NAMES: Record<ProjectStage, string> = {
    'Design': 'Design Phase',
    'Material Ordering': 'Material Ordering',
    'Production': 'Production Phase',
    'Site Work': 'Site Execution',
    'Installation': 'Installation',
    'Handover': 'Final Handover',
    'Completed': 'Project Complete',
};

export const STAGE_DESCRIPTIONS: Record<ProjectStage, { title: string; note: string; action: string }> = {
    'Design': {
        title: "Blueprint & Visualization",
        note: "Crafting architectural layouts and high-fidelity renders.",
        action: "Finalizing aesthetic direction."
    },
    'Material Ordering': {
        title: "Sourcing & Logistics",
        note: "Procuring raw materials and modular components.",
        action: "Inventory verification and vendor lock."
    },
    'Production': {
        title: "Factory Processing",
        note: "Custom elements are now in production at the modular facility.",
        action: "Quality checks on raw finishes."
    },
    'Site Work': {
        title: "On-Site Execution",
        note: "Civil work and site preparation is active.",
        action: "Daily supervisor site updates."
    },
    'Installation': {
        title: "Final Assembly",
        note: "Modular components are being installed on-site.",
        action: "Snag list generation and fitment check."
    },
    'Handover': {
        title: "Quality Audit",
        note: "Final cleaning and management handover verification.",
        action: "Issuing completion certificate."
    },
    'Completed': {
        title: "Welcome Home",
        note: "Vision fully realized. Keys handed to client.",
        action: "Project archived."
    }
};

export const AMAZ_SUPPORT_USER_ID = '786786';
