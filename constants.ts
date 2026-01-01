
import { ProjectStage } from './types';

export const USER_ROLES = ['Admin', 'Sub-Admin', 'Designer', 'Customer', 'Accounts', 'Project Head', 'Production Head', 'Site Head'];

export const PROJECT_STAGES: ProjectStage[] = [
  'design_phase',
  'awaiting_updated_quote',
  'material_selection',
  'execution',
  'awaiting_client_completion_approval',
  'awaiting_admin_completion_approval',
  'completed'
];

export const STAGE_DISPLAY_NAMES: Record<ProjectStage, string> = {
    design_phase: 'Design Phase',
    awaiting_updated_quote: 'Quotation Review',
    material_selection: 'Material Selection',
    execution: 'Execution Phase',
    awaiting_client_completion_approval: 'Quality Audit',
    awaiting_admin_completion_approval: 'Admin Handover',
    completed: 'Project Complete',
};

export const STAGE_DESCRIPTIONS: Record<ProjectStage, { title: string; note: string; action: string }> = {
    design_phase: {
        title: "Blueprint & Visualization",
        note: "Our designers are currently crafting your 2D layouts and high-fidelity 3D renders.",
        action: "Finalizing architectural flow and aesthetic direction."
    },
    awaiting_updated_quote: {
        title: "Commercial Finalization",
        note: "We are calculating the exact investment based on your finalized design blueprints.",
        action: "Bill of Quantities (BOQ) generation and price locking."
    },
    material_selection: {
        title: "Tactile Experience",
        note: "Time to select physical swatches, board finishes, and hardware components.",
        action: "Approval of laminates, stones, and textures at the studio."
    },
    execution: {
        title: "On-Site Transformation",
        note: "The heavy lifting begins. Civil work and modular installation are now active on-site.",
        action: "Daily site updates and supervisor inspections."
    },
    awaiting_client_completion_approval: {
        title: "Final Walkthrough",
        note: "The project is reaching its peak. We need you to verify the finishing quality.",
        action: "Creation of the final punch-list and quality clearance."
    },
    awaiting_admin_completion_approval: {
        title: "Regulatory Handover",
        note: "Internal audit for warranty documentation and final project closure.",
        action: "Verifying all systems and issuing completion certificates."
    },
    completed: {
        title: "Welcome Home",
        note: "Congratulations! Your vision has been fully realized and the keys are yours.",
        action: "Move-in ready status and maintenance guide issue."
    }
};

export const AMAZ_SUPPORT_USER_ID = '786786';
