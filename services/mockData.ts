import { User, Project, Task, Design, Message, SiteVisit, Milestone, ActivityLog, Quote, SupportTicket, AttendanceLog, LeaveRequest, WorkLog, ProjectUpdate, Comment, Expense, Product, ProjectTemplate, Announcement } from '../types';

// NOTE: This mock data is deprecated. The app now fetches data from a Supabase backend.
// This file is kept to avoid breaking existing import statements during the transition.

export const MOCK_USERS: User[] = [];

export const MOCK_PROJECTS: Project[] = [];

export const MOCK_TASKS: Task[] = [];

export const MOCK_COMMENTS: Comment[] = [];

export const MOCK_DESIGNS: Design[] = [];

export const MOCK_MESSAGES: Message[] = [];

export const MOCK_MILESTONES: Milestone[] = [];

export const MOCK_QUOTES: Quote[] = [];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [];

export const MOCK_SITE_VISITS: SiteVisit[] = [];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [];

export const MOCK_ATTENDANCE_LOGS: AttendanceLog[] = [];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];

export const MOCK_WORK_LOGS: WorkLog[] = [];

export const MOCK_PROJECT_UPDATES: ProjectUpdate[] = [];

export const MOCK_FINAL_GALLERY_IMAGES: {id: string; projectId: string; url: string; caption: string}[] = [];

export const MOCK_EXPENSES: Expense[] = [];

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_PROJECT_TEMPLATES: ProjectTemplate[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];