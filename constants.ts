
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
    awaiting_updated_quote: 'Awaiting Updated Quote',
    material_selection: 'Material Selection',
    execution: 'In Progress',
    awaiting_client_completion_approval: 'Awaiting Client Completion Approval',
    awaiting_admin_completion_approval: 'Awaiting Admin Completion Approval',
    completed: 'Completed',
};

// A constant ID for the system user that sends automated messages
// Updated to 786786 per user requirement
export const AMAZ_SUPPORT_USER_ID = '786786';
