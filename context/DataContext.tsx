
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    Project, Task, Design, Message, Milestone, Quote, ActivityLog, SiteVisit,
    SupportTicket, AttendanceLog, LeaveRequest, WorkLog, ProjectUpdate,
    Expense, Product, ProjectTemplate, Announcement, Post, FeedComment, FinalGalleryImage
} from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
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
    finalGalleryImages: FinalGalleryImage[];
    expenses: Expense[];
    products: Product[];
    projectTemplates: ProjectTemplate[];
    announcements: Announcement[];
    posts: Post[];
    feedComments: FeedComment[];
    refetchData: () => Promise<void>;
    loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mapToCamelCase = <T,>(data: any[] | null, mapper: (item: any) => T): T[] => {
    if (!data) return [];
    return data.map(mapper);
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [designs, setDesigns] = useState<Design[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
    const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
    const [finalGalleryImages, setFinalGalleryImages] = useState<FinalGalleryImage[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [feedComments, setFeedComments] = useState<FeedComment[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        try {
            const tables = [
                'projects', 'tasks', 'designs', 'messages', 'milestones', 'quotes', 'activity_logs', 
                'site_visits', 'support_tickets', 'attendance_logs', 'leave_requests', 'work_logs', 
                'project_updates', 'final_gallery_images', 'expenses', 'products', 'project_templates', 
                'announcements', 'posts', 'feed_comments'
            ];
            
            const promises = tables.map(table => supabase.from(table).select('*'));
            const results = await Promise.all(promises);

            const dataMap: { [key: string]: any[] } = {};
            results.forEach((result, index) => {
                const tableName = tables[index];
                if (result.error) {
                    console.warn(`Could not fetch from table "${tableName}":`, result.error.message);
                    dataMap[tableName] = [];
                } else {
                    dataMap[tableName] = result.data || [];
                }
            });
            
            setProjects(mapToCamelCase(dataMap.projects, p => ({ ...p, customerId: p.customer_id, designerId: p.designer_id, adminId: p.admin_id, budgetDisplay: p.budget_display, areaSqft: p.area_sqft, startDate: p.start_date, createdAt: p.created_at, updatedAt: p.updated_at, revenueDisplay: p.revenue_display })));
            setTasks(mapToCamelCase(dataMap.tasks, t => ({ ...t, projectId: t.project_id, assigneeId: t.assignee_id, dueDate: t.due_date })));
            setDesigns(mapToCamelCase(dataMap.designs, d => ({ ...d, projectId: d.project_id, uploadedBy: d.uploaded_by, fileUrl: d.file_url, submittedForReview: d.submitted_for_review, comments: d.comments || [], approvedBy: d.approved_by, approvedAt: d.approved_at })));
            setMessages(mapToCamelCase(dataMap.messages, m => ({ ...m, chatId: m.chat_id, senderId: m.sender_id, createdAt: m.created_at })));
            setMilestones(mapToCamelCase(dataMap.milestones, m => ({ ...m, projectId: m.project_id, amountDisplay: m.amount_display, dueDate: m.due_date, statusDisplay: m.status_display, paidDateDisplay: m.paid_date_display })));
            setQuotes(mapToCamelCase(dataMap.quotes, q => ({ ...q, projectId: q.project_id, fileUrl: q.file_url, uploadedBy: q.uploaded_by, createdAt: q.created_at })));
            setActivityLogs(mapToCamelCase(dataMap.activity_logs, a => ({ ...a, projectId: a.project_id, actorId: a.actor_id, createdAt: a.created_at })));
            setSiteVisits(mapToCamelCase(dataMap.site_visits, sv => ({ ...sv, projectId: sv.project_id, scheduledAt: sv.scheduled_at, requestedBy: sv.requested_by })));
            setSupportTickets(mapToCamelCase(dataMap.support_tickets, st => ({ ...st, submittedBy: st.submitted_by, projectId: st.project_id, createdAt: st.created_at })));
            setAttendanceLogs(mapToCamelCase(dataMap.attendance_logs, al => ({ ...al, designerId: al.designer_id, clockIn: al.clock_in, clockOut: al.clock_out, ipAddress: al.ip_address })));
            setLeaveRequests(mapToCamelCase(dataMap.leave_requests, lr => ({ ...lr, designerId: lr.designer_id, startDate: lr.start_date, endDate: lr.end_date })));
            setWorkLogs(mapToCamelCase(dataMap.work_logs, wl => ({ ...wl, designerId: wl.designer_id, projectId: wl.project_id, tasksCompleted: wl.tasks_completed, hoursSpent: wl.hours_spent })));
            setProjectUpdates(mapToCamelCase(dataMap.project_updates, pu => ({ ...pu, projectId: pu.project_id, authorId: pu.author_id, createdAt: pu.created_at })));
            setFinalGalleryImages(mapToCamelCase(dataMap.final_gallery_images, fgi => ({ ...fgi, projectId: fgi.project_id })));
            setExpenses(mapToCamelCase(dataMap.expenses, e => ({ ...e, projectId: e.project_id })));
            setProducts(mapToCamelCase(dataMap.products, p => ({ ...p, projectId: p.project_id, imageUrl: p.image_url })));
            setProjectTemplates(mapToCamelCase(dataMap.project_templates, pt => ({ ...pt })));
            setAnnouncements(mapToCamelCase(dataMap.announcements, a => ({ ...a, authorId: a.author_id, createdAt: a.created_at })));
            setPosts(mapToCamelCase(dataMap.posts, p => ({
                ...p,
                authorId: p.author_id,
                isPinned: p.is_pinned,
                projectId: p.project_id,
                postType: p.post_type,
                showcaseDetails: p.showcase_details,
                mediaUrl: p.media_url,
                mediaType: p.media_type,
                beforeMediaUrl: p.before_media_url,
                createdAt: p.created_at,
                // FIX: Ensure required fields have default values
                reactions: p.reactions || [],
                visibility: p.visibility || 'everyone',
                tags: p.tags || [],
                content: p.content || '',
            })));
            setFeedComments(mapToCamelCase(dataMap.feed_comments, fc => ({ ...fc, postId: fc.post_id, authorId: fc.author_id, createdAt: fc.created_at })));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]));

    useEffect(() => {
        if (!authLoading) {
            fetchData();
        }
    }, [authLoading, fetchData]);

    const value: DataContextType = {
        projects, tasks, designs, messages, milestones, quotes, activityLogs, siteVisits,
        supportTickets, attendanceLogs, leaveRequests, workLogs, projectUpdates,
        finalGalleryImages, expenses, products, projectTemplates, announcements, posts, feedComments,
        refetchData: fetchData,
        loading,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
