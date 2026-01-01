
import { ProjectStage } from './types';

export const USER_ROLES = ['Admin', 'Sub-Admin', 'Designer', 'Customer', 'Accounts', 'Project Head', 'Production Head', 'Site Head'];

export const PROJECT_STAGES: ProjectStage[] = [
  'design',
  'design_phase',
  'material_selection',
  'material_ordering',
  'production',
  'site_work',
  'execution',
  'installation',
  'handover',
  'completed'
];

export const STAGE_DISPLAY_NAMES: Record<ProjectStage, string> = {
    design: 'Design Phase',
    design_phase: 'Initial Design',
    material_selection: 'Material Selection',
    material_ordering: 'Material Ordering',
    production: 'Production Phase',
    site_work: 'Site Execution',
    execution: 'In Execution',
    installation: 'Installation',
    handover: 'Final Handover',
    completed: 'Project Complete',
};

export const STAGE_DESCRIPTIONS: Record<ProjectStage, { title: string; note: string; action: string }> = {
    design: {
        title: "Blueprint & Visualization",
        note: "Crafting architectural layouts and high-fidelity renders.",
        action: "Finalizing aesthetic direction."
    },
    design_phase: {
        title: "Design Initialization",
        note: "Starting the visual journey of your dream space.",
        action: "Setting project boundaries."
    },
    material_selection: {
        title: "Palette & Finishes",
        note: "Choosing the tactile elements that define your home.",
        action: "Approving textures and boards."
    },
    material_ordering: {
        title: "Sourcing & Logistics",
        note: "Procuring raw materials and modular components.",
        action: "Inventory verification and vendor lock."
    },
    production: {
        title: "Factory Processing",
        note: "Custom elements are now in production at the modular facility.",
        action: "Quality checks on raw finishes."
    },
    site_work: {
        title: "On-Site Execution",
        note: "Civil work and site preparation is active.",
        action: "Daily supervisor site updates."
    },
    execution: {
        title: "Active Implementation",
        note: "Transforming designs into reality on ground.",
        action: "Monitoring precision on-site."
    },
    installation: {
        title: "Final Assembly",
        note: "Modular components are being installed on-site.",
        action: "Snag list generation and fitment check."
    },
    handover: {
        title: "Quality Audit",
        note: "Final cleaning and management handover verification.",
        action: "Issuing completion certificate."
    },
    completed: {
        title: "Welcome Home",
        note: "Vision fully realized. Keys handed to client.",
        action: "Project archived."
    }
};

export const AMAZ_SUPPORT_USER_ID = '786786';
