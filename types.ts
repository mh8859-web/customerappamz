
export type UserRole = 'Admin' | 'Sub-Admin' | 'Designer' | 'Customer' | 'Accounts' | 'Project Head' | 'Production Head' | 'Site Head';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  verified: boolean;
  verificationRequested: boolean;
  userId: string;
}

export interface CurrentWork {
  id: string;
  designerId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

export type ProjectStage =
  | 'design_phase'
  | 'awaiting_updated_quote'
  | 'material_selection'
  | 'execution'
  | 'awaiting_client_completion_approval'
  | 'awaiting_admin_completion_approval'
  | 'completed';

export interface Project {
  id: string;
  title: string;
  description: string;
  customerId: string;
  designerId: string;
  adminId: string;
  address: string;
  budgetDisplay: number;
  areaSqft: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  revenueDisplay: number;
  progress: number;
  status: 'Active' | 'Completed' | 'Archived';
  stage: ProjectStage;
}

export interface Quote {
  id: string;
  projectId: string;
  version: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  amountDisplay: number;
  dueDate: string;
  statusDisplay: 'Pending' | 'Completed' | 'Paid';
  paidDateDisplay?: string;
}

export interface Comment {
    id: string;
    authorId: string;
    createdAt: string;
    status: 'Open' | 'Resolved';
    x: number;
    y: number;
    text: string;
}

export interface Design {
  id: string;
  projectId: string;
  version: number;
  notes: string;
  fileUrl: string;
  type: 'image' | 'gltf';
  uploadedBy: string;
  submittedForReview: boolean;
  approved: boolean;
  comments: Comment[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  authorId: string;
  message: string;
  createdAt: string;
}

// --- FIX: Added UnifiedUpdate interface to resolve import error in ProjectDetails.tsx ---
export interface UnifiedUpdate {
    id: string;
    type: string;
    author: User | undefined;
    content: string;
    timestamp: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface WorkLog {
  id: string;
  designerId: string;
  projectId: string;
  date: string;
  tasksCompleted: string;
  hoursSpent: number;
}

export interface Product {
  id: string;
  projectId: string;
  name: string;
  supplier: string;
  imageUrl: string;
  cost: number;
  quantity: number;
  status: 'Pending' | 'Ordered' | 'Delivered';
}

export interface Task {
  id: string;
  projectId: string;
  assigneeId: string;
  title: string;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'For Review' | 'Done';
}

export interface AttendanceLog {
  id: string;
  designerId: string;
  clockIn: string;
  clockOut: string | null;
  duration: string;
  location: string;
  ipAddress: string;
  workSummary: string;
}

export interface LeaveRequest {
  id: string;
  designerId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  milestones: {
    title: string;
    amountPercentage: number;
  }[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  attachments: {
    url: string;
    type: 'image' | 'video' | 'file';
    name: string;
  }[] | null;
  createdAt: string;
  isSystemMessage?: boolean;
}

export interface SiteVisit {
  id: string;
  projectId: string;
  scheduledAt: string;
  requestedBy: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface SupportTicket {
    id: string;
    submittedBy: string;
    projectId: string;
    subject: string;
    message: string;
    status: 'Open' | 'In Progress' | 'Closed';
    createdAt: string;
}

export interface Expense {
    id: string;
    projectId: string;
    description: string;
    amount: number;
    date: string;
}

export interface FinalGalleryImage {
    id: string;
    projectId: string;
    url: string;
    caption: string;
}

export interface Announcement {
    id: string;
    authorId: string;
    content: string;
    target: 'All' | 'Designers' | 'Customers';
    createdAt: string;
}

export type ReactionType = 'love' | 'idea' | 'thought' | 'kudos';

export type PostVisibility = 'everyone' | 'team_only' | 'project_members';

export interface Post {
    id: string;
    authorId: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    beforeMediaUrl?: string;
    reactions: { userId: string; type: ReactionType }[];
    isPinned: boolean;
    projectId?: string;
    postType: 'standard' | 'showcase' | 'before_after';
    showcaseDetails?: {
        style: string;
        materials: string;
        palette: string;
    };
    tags: string[];
    visibility: PostVisibility;
    createdAt: string;
}

export interface FeedComment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: string;
}
