import { User, Project, Task, Design, Message, SiteVisit, Milestone, ActivityLog, Quote, SupportTicket, AttendanceLog, LeaveRequest, WorkLog, ProjectUpdate, Comment, Expense, Product, ProjectTemplate, Announcement, Post, FeedComment } from '../types';

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

export const MOCK_POSTS: Post[] = [
    {
        id: 'post-1',
        authorId: 'DESIGNER_1', // Placeholder
        content: 'Absolutely thrilled with how the mood board for the #JapandiLiving project is coming together! The blend of natural textures and minimalist design is creating such a serene vibe. What do you all think? ✨',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        reactions: [{ type: 'love', userId: 'ADMIN_1' }, { type: 'idea', userId: 'CUSTOMER_1' }],
        isPinned: true,
        postType: 'standard',
        tags: ['#JapandiLiving'],
        visibility: 'everyone',
    },
    {
        id: 'post-2',
        authorId: 'CUSTOMER_1', // Placeholder
        content: "Just saw the latest 3D renders for our kitchen and I'm speechless! It's exactly what we dreamed of. Can't wait to see it come to life!",
        mediaUrl: 'https://images.unsplash.com/photo-1600585152225-358b54e50ae8?q=80&w=2070&auto=format&fit=crop',
        mediaType: 'image',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        reactions: [{ type: 'love', userId: 'DESIGNER_1' }],
        postType: 'standard',
        tags: [],
        visibility: 'everyone',
    },
    {
        id: 'post-3',
        authorId: 'ADMIN_1', // Placeholder
        content: "Team, let's give a huge shoutout to our sourcing partners for finding this incredible marble slab. It's going to be the centerpiece of the Hillside Estate project. #LuxuryDesign #Materials",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        reactions: [{ type: 'kudos', userId: 'DESIGNER_1' }],
        postType: 'standard',
        tags: ['#LuxuryDesign', '#Materials'],
        visibility: 'team_only',
    }
];

export const MOCK_FEED_COMMENTS: FeedComment[] = [
    {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'ADMIN_1', // Placeholder
        content: 'This looks amazing! The client is going to love it.',
        createdAt: new Date(Date.now() - 86400000 * 1.9).toISOString(),
    },
    {
        id: 'comment-2',
        postId: 'post-1',
        authorId: 'CUSTOMER_1', // Placeholder
        content: 'Wow! So excited 😍',
        createdAt: new Date(Date.now() - 86400000 * 1.8).toISOString(),
    }
];