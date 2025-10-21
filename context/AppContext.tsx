import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Project, Task, Design, Message, Milestone, Quote, ActivityLog, SiteVisit, SupportTicket, AttendanceLog, LeaveRequest, WorkLog, ProjectUpdate, Expense, Product, ProjectTemplate, Announcement, Post, FeedComment } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define the shape of the unified context
interface AppContextType {
  // App Status
  status: 'initializing' | 'authenticated' | 'public';
  
  // Auth
  user: User | null;
  login: (userId: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  updateUserContext: (updates: Partial<User>) => void;
  
  // Data
  users: User[];
  projects: Project[];
  tasks: Task[];
  designs: Design[];
  messages: Message[];
  milestones: Milestone[];
  quotes: Quote[];
  activityLogs: ActivityLog[];
  siteVisits: SiteVisit[];
  supportTickets: SupportTicket[];
  attendanceLogs: AttendanceLog[];
  leaveRequests: LeaveRequest[];
  workLogs: WorkLog[];
  projectUpdates: ProjectUpdate[];
  finalGalleryImages: any[];
  expenses: Expense[];
  products: Product[];
  projectTemplates: ProjectTemplate[];
  announcements: Announcement[];
  posts: Post[];
  feedComments: FeedComment[];
  
  // Actions
  findUserById: (id: string) => User | undefined;
  refetchAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const fetchAndMapProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', supabaseUser.id).single();
    if (error || !data) {
        console.error('Failed to fetch user profile:', error);
        await supabase.auth.signOut(); // Log out if profile is missing/corrupted
        return null;
    }
    return {
        id: data.id, fullName: data.full_name || 'User', email: data.email, role: data.role,
        avatarUrl: data.avatar_url, verified: data.verified, verificationRequested: data.verification_requested,
        userId: data.user_id,
    };
};

const mapToCamelCase = (data: any[], mapper: (item: any) => any) => data ? data.map(mapper) : [];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [status, setStatus] = useState<'initializing' | 'authenticated' | 'public'>('initializing');
    const [user, setUser] = useState<User | null>(null);
    const [allData, setAllData] = useState<Omit<AppContextType, 'status' | 'user' | 'login' | 'logout' | 'updateUserContext' | 'findUserById' | 'refetchAllData'>>({
        users: [], projects: [], tasks: [], designs: [], messages: [], milestones: [], quotes: [], activityLogs: [], siteVisits: [], supportTickets: [],
        attendanceLogs: [], leaveRequests: [], workLogs: [], projectUpdates: [], finalGalleryImages: [], expenses: [], products: [],
        projectTemplates: [], announcements: [], posts: [], feedComments: [],
    });

    const fetchAllData = useCallback(async (): Promise<void> => {
        try {
            const tables = [
                'users', 'projects', 'tasks', 'designs', 'messages', 'milestones', 'quotes', 'activity_logs', 'site_visits', 'support_tickets', 'attendance_logs', 'leave_requests', 'work_logs', 'project_updates', 'final_gallery_images', 'expenses', 'products', 'project_templates', 'announcements', 'posts', 'feed_comments'
            ];
            const promises = tables.map(table => supabase.from(table).select('*'));
            const results = await Promise.all(promises);

            const dataMap: { [key: string]: any[] } = {};
            results.forEach((result, i) => {
                dataMap[tables[i]] = result.error ? [] : (result.data || []);
                if (result.error) console.warn(`Could not fetch from table "${tables[i]}":`, result.error.message);
            });
            
            setAllData({
                users: mapToCamelCase(dataMap.users, u => ({ id: u.id, fullName: u.full_name || 'Unnamed User', email: u.email, role: u.role, avatarUrl: u.avatar_url || '', verified: !!u.verified, verificationRequested: u.verification_requested, userId: u.user_id || ''})),
                projects: mapToCamelCase(dataMap.projects, p => ({ id: p.id, title: p.title, description: p.description, customerId: p.customer_id, designerId: p.designer_id, adminId: p.admin_id, budgetDisplay: p.budget_display, areaSqft: p.area_sqft, address: p.address, status: p.status, stage: p.stage, startDate: p.start_date, createdAt: p.created_at, updatedAt: p.updated_at, revenueDisplay: p.revenue_display, progress: p.progress })),
                tasks: mapToCamelCase(dataMap.tasks, t => ({ id: t.id, projectId: t.project_id, title: t.title, assigneeId: t.assignee_id, status: t.status, dueDate: t.due_date })),
                designs: mapToCamelCase(dataMap.designs, d => ({ id: d.id, projectId: d.project_id, uploadedBy: d.uploaded_by, fileUrl: d.file_url, type: d.type, version: d.version, notes: d.notes, approved: d.approved, submittedForReview: d.submitted_for_review, comments: d.comments || [], approvedBy: d.approved_by, approvedAt: d.approved_at })),
                messages: mapToCamelCase(dataMap.messages, m => ({ id: m.id, chatId: m.chat_id, senderId: m.sender_id, body: m.body, createdAt: m.created_at, attachments: m.attachments })),
                milestones: mapToCamelCase(dataMap.milestones, m => ({ id: m.id, projectId: m.project_id, title: m.title, amountDisplay: m.amount_display, dueDate: m.due_date, statusDisplay: m.status_display, paidDateDisplay: m.paid_date_display })),
                quotes: mapToCamelCase(dataMap.quotes, q => ({ id: q.id, projectId: q.project_id, version: q.version, fileUrl: q.file_url, uploadedBy: q.uploaded_by, createdAt: q.created_at })),
                activityLogs: mapToCamelCase(dataMap.activity_logs, a => ({ id: a.id, projectId: a.project_id, actorId: a.actor_id, action: a.action, details: a.details, createdAt: a.created_at })),
                siteVisits: mapToCamelCase(dataMap.site_visits, sv => ({ id: sv.id, projectId: sv.project_id, scheduledAt: sv.scheduled_at, requestedBy: sv.requested_by, status: sv.status })),
                supportTickets: mapToCamelCase(dataMap.support_tickets, st => ({ id: st.id, submittedBy: st.submitted_by, projectId: st.project_id, subject: st.subject, message: st.message, status: st.status, createdAt: st.created_at })),
                attendanceLogs: mapToCamelCase(dataMap.attendance_logs, al => ({ id: al.id, designerId: al.designer_id, clockIn: al.clock_in, clockOut: al.clock_out, duration: al.duration, location: al.location, ipAddress: al.ip_address })),
                leaveRequests: mapToCamelCase(dataMap.leave_requests, lr => ({ id: lr.id, designerId: lr.designer_id, reason: lr.reason, startDate: lr.start_date, endDate: lr.end_date, status: lr.status })),
                workLogs: mapToCamelCase(dataMap.work_logs, wl => ({ id: wl.id, designerId: wl.designer_id, projectId: wl.project_id, date: wl.date, tasksCompleted: wl.tasks_completed, hoursSpent: wl.hours_spent })),
                projectUpdates: mapToCamelCase(dataMap.project_updates, pu => ({ id: pu.id, projectId: pu.project_id, authorId: pu.author_id, message: pu.message, createdAt: pu.created_at })),
                finalGalleryImages: mapToCamelCase(dataMap.final_gallery_images, fgi => ({ id: fgi.id, projectId: fgi.project_id, url: fgi.url, caption: fgi.caption })),
                expenses: mapToCamelCase(dataMap.expenses, e => ({ id: e.id, projectId: e.project_id, description: e.description, amount: e.amount, date: e.date })),
                products: mapToCamelCase(dataMap.products, p => ({ id: p.id, projectId: p.project_id, name: p.name, supplier: p.supplier, imageUrl: p.image_url, cost: p.cost, quantity: p.quantity, status: p.status })),
                projectTemplates: mapToCamelCase(dataMap.project_templates, pt => ({ id: pt.id, name: pt.name, description: pt.description, milestones: pt.milestones })),
                announcements: mapToCamelCase(dataMap.announcements, a => ({ id: a.id, authorId: a.author_id, content: a.content, target: a.target, createdAt: a.created_at })),
                posts: mapToCamelCase(dataMap.posts, p => ({...p, authorId: p.author_id, isPinned: p.is_pinned, projectId: p.project_id, postType: p.post_type, showcaseDetails: p.showcase_details, mediaUrl: p.media_url, mediaType: p.media_type, beforeMediaUrl: p.before_media_url, createdAt: p.created_at })),
                feedComments: mapToCamelCase(dataMap.feed_comments, fc => ({ id: fc.id, postId: fc.post_id, authorId: fc.author_id, content: fc.content, createdAt: fc.created_at })),
            });
            // Fix: No return value to match Promise<void> type in interface.
        } catch (error) {
            console.error("Error fetching all data:", error);
            // Fix: No return value to match Promise<void> type in interface.
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (status === 'initializing') {
                console.warn("Auth check timed out. Defaulting to public state.");
                setStatus('public');
            }
        }, 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            clearTimeout(timer);
            if (session?.user) {
                const profile = await fetchAndMapProfile(session.user);
                setUser(profile);
                if (profile) {
                    await fetchAllData();
                    setStatus('authenticated');
                } else {
                    // Profile fetch failed, treat as logged out
                    setStatus('public');
                }
            } else {
                setUser(null);
                setStatus('public');
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, [fetchAllData, status]);

    const login = async (userId: string, password: string) => {
        const { data: profileForEmail } = await supabase.from('users').select('email').eq('user_id', userId.trim().toLowerCase()).single();
        if (!profileForEmail?.email) return { success: false, error: 'INVALID_CREDENTIALS' };
        
        const { data, error } = await supabase.auth.signInWithPassword({ email: profileForEmail.email, password: password.trim() });
        if (error || !data.user) return { success: false, error: 'INVALID_CREDENTIALS' };
        
        // onAuthStateChange will handle the rest
        return { success: true, error: null };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAllData(prev => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: [] }), {}) as typeof prev);
        setStatus('public');
    };

    const updateUserContext = (updates: Partial<User>) => {
        setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
    };
    
    const findUserById = (id: string): User | undefined => {
        return allData.users.find(user => user.id === id);
    };

    const value: AppContextType = {
        status, user, login, logout, updateUserContext,
        ...allData,
        findUserById,
        refetchAllData: fetchAllData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
