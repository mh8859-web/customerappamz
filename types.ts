
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
  // Enhanced Profile Fields
  joinedDate?: string;
  experience?: string;
  phoneNumber?: string;
  idProofUrls?: string[];
}

// ALIGNED WITH SUPABASE ENUM
export type ProjectStage =
  | 'design_phase'
  | 'material_selection'
  | 'production_phase'
  | 'site_work'
  | 'installation'
  | 'handover'
  | 'management_approval'
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
  budgetApproved: number;
  areaSqft: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  revenueDisplay: number;
  progress: number;
  status: 'Active' | 'Completed' | 'Archived';
  stage: ProjectStage;
  isPaymentAlertActive?: boolean;
  isDelayed?: boolean;
  requestedMilestoneId?: string;
  friendlyReminderMilestoneId?: string;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  supervisorId: string;
  notes: string;
  imageUrl?: string;
  videoUrl?: string;
  stage: ProjectStage;
  createdAt: string;
}

export interface MaterialRequest {
  id: string;
  projectId: string;
  requesterId: string;
  materialName: string;
  quantity: string;
  vendor: string;
  deliveryDate: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Delivered';
  approvedBy?: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  amountDisplay: number;
  dueDate: string;
  statusDisplay: 'Pending' | 'Completed' | 'Verifying' | 'Paid';
  paidDateDisplay?: string;
}

export interface Expense {
    id: string;
    projectId: string;
    description: string;
    amount: number;
    date: string;
    category: 'Material' | 'Labor' | 'Site_Consumable' | 'Travel' | 'Other';
    receiptUrl?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  isSystemMessage?: boolean;
  createdAt: string;
  attachments?: {
    url: string;
    type: 'image' | 'video' | 'file';
    name: string;
  }[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'For Review' | 'Done';
  isApproved?: boolean;
}

export interface CurrentWork {
  id: string;
  designerId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
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
  comments: any[];
}

export interface AttendanceLog {
  id: string;
  designerId: string;
  clockIn: string;
  clockOut: string | null;
  duration: string;
  location: string;
  ipAddress: string;
  work_summary: string;
}

export interface LeaveRequest {
  id: string;
  designerId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Quote {
  id: string;
  projectId: string;
  version: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface FinalGalleryImage {
  id: string;
  projectId: string;
  url: string;
  caption: string;
}

export interface WorkLog {
  id: string;
  designerId: string;
  projectId: string;
  date: string;
  tasksCompleted: string;
  hoursSpent: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  milestones: { title: string; amountPercentage: number }[];
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  x: number;
  y: number;
  createdAt: string;
  status: 'Open' | 'Resolved';
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

export interface ActivityLog {
  id: string;
  projectId?: string;
  actorId: string;
  action: string;
  createdAt: string;
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
  status: 'Open' | 'Closed';
  createdAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  content: string;
  target: 'All' | 'Designers' | 'Customers';
  createdAt: string;
}

export interface UserSalaryConfig {
  id: string;
  userId: string;
  payType: 'Monthly' | 'Daily';
  baseAmount: number;
  updatedAt: string;
}

export interface Material {
  id: string;
  projectId: string;
  name: string;
  category: string;
  brand: string;
  imageUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  message: string;
  targetUserIds: string[]; 
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Testimonial {
  id: string;
  projectId: string;
  clientId: string;
  videoUrl: string;
  createdAt: string;
}
