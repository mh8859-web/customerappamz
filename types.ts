export type UserRole = 'Admin' | 'Designer' | 'Customer';

export type ProjectStage = 
  | 'design_phase'
  | 'awaiting_updated_quote'
  | 'material_selection'
  | 'execution'
  | 'awaiting_client_completion_approval'
  | 'awaiting_admin_completion_approval'
  | 'completed';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  verified?: boolean;
  verificationRequested?: boolean;
  userId?: string;
  password?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  customerId: string;
  designerId: string;
  adminId: string;
  budgetDisplay: number;
  areaSqft: number;
  address: string;
  status: 'Active' | 'Completed';
  stage: ProjectStage;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  revenueDisplay: number;
  progress: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  status: 'To Do' | 'In Progress' | 'For Review' | 'Done';
  dueDate: string;
}

export interface Comment {
  id: string;
  x: number;
  y: number;
  text: string;
  authorId: string;
  createdAt: string;
  status: 'Open' | 'Resolved';
}

export interface Design {
  id:string;
  projectId: string;
  uploadedBy: string;
  fileUrl: string;
  type: 'image' | 'gltf';
  version: number;
  notes: string;
  approved: boolean;
  submittedForReview: boolean;
  comments?: Comment[];
  approvedBy?: string;
  approvedAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  createdAt: string;
  attachments?: {
      url: string;
      type: 'image' | 'video' | 'file';
      name: string;
  }[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  amountDisplay: number;
  dueDate: string;
  statusDisplay: 'Paid' | 'Completed' | 'Pending';
  paidDateDisplay?: string;
}

export interface Quote {
  id: string;
  projectId: string;
  version: 'initial' | 'final';
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface SiteVisit {
  id: string;
  projectId: string;
  scheduledAt: string;
  requestedBy: string;
  status: 'Scheduled';
}

export interface SupportTicket {
    id: string;
    submittedBy: string;
    projectId: string;
    subject: string;
    message: string;
    status: 'Open' | 'Closed' | 'In Progress';
    createdAt: string;
}

export interface AttendanceLog {
    id: string;
    designerId: string;
    clockIn: string;
    clockOut: string | null;
    duration: string;
    location: string;
    ipAddress: string;
}

export interface LeaveRequest {
    id: string;
    designerId: string;
    reason: string;
    startDate: string;
    endDate: string;
    status: 'Approved' | 'Pending' | 'Rejected';
}

export interface WorkLog {
    id: string;
    designerId: string;
    projectId: string;
    date: string;
    tasksCompleted: string;
    hoursSpent: number;
}

export interface ProjectUpdate {
    id: string;
    projectId: string;
    authorId: string;
    message: string;
    createdAt: string;
}

export interface Expense {
    id: string;
    projectId: string;
    description: string;
    amount: number;
    date: string;
}

export interface Product {
    id: string;
    projectId: string;
    name: string;
    supplier: string;
    imageUrl: string;
    cost: number;
    quantity: number;
    status: 'Ordered' | 'Pending' | 'Delivered';
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

export interface Announcement {
    id: string;
    authorId: string;
    content: string;
    target: 'Designers' | 'Customers' | 'All';
    createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes: string[];
  createdAt: string;
  poll?: Poll;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}