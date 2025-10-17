import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    Project, Task, Design, Message, Milestone, Quote, ActivityLog, SiteVisit,
    SupportTicket, AttendanceLog, LeaveRequest, WorkLog, ProjectUpdate,
    Expense, Product, ProjectTemplate, Announcement, Post, FeedComment
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
    finalGalleryImages: any[];
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

const mapToCamelCase = (data: any[], mapper: (item: any) => any) => {
    return data ? data.map(mapper) : [];
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
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
    const [finalGalleryImages, setFinalGalleryImages] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [feedComments, setFeedComments] = useState<FeedComment[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        if (!user) {
            setProjects([]); setTasks([]); setDesigns([]); setMessages([]); setMilestones([]);
            setQuotes([]); setActivityLogs([]); setSiteVisits([]); setSupportTickets([]);
            setAttendanceLogs([]); setLeaveRequests([]); setWorkLogs([]); setProjectUpdates([]);
            setFinalGalleryImages([]); setExpenses([]); setProducts([]); setProjectTemplates([]);
            setAnnouncements([]); setPosts([]); setFeedComments([]);
            setLoading(false);
            return;
        }

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
            for (let i = 0; i < tables.length; i++) {
                const { data, error } = results[i];
                if (error) {
                    console.warn(`Could not fetch from table "${tables[i]}":`, error.message);
                    dataMap[tables[i]] = [];
                } else {
                    dataMap[tables[i]] = data || [];
                }
            }
            
            setProjects(mapToCamelCase(dataMap.projects, p => ({ id: p.id, title: p.title, description: p.description, customerId: p.customer_id, designerId: p.designer_id, adminId: p.admin_id, budgetDisplay: p.budget_display, areaSqft: p.area_sqft, address: p.address, status: p.status, stage: p.stage, startDate: p.start_date, createdAt: p.created_at, updatedAt: p.updated_at, revenueDisplay: p.revenue_display, progress: p.progress })));
            setTasks(mapToCamelCase(dataMap.tasks, t => ({ id: t.id, projectId: t.project_id, title: t.title, assigneeId: t.assignee_id, status: t.status, dueDate: t.due_date })));
            setDesigns(mapToCamelCase(dataMap.designs, d => ({ id: d.id, projectId: d.project_id, uploadedBy: d.uploaded_by, fileUrl: d.file_url, type: d.type, version: d.version, notes: d.notes, approved: d.approved, submittedForReview: d.submitted_for_review, comments: d.comments || [], approvedBy: d.approved_by, approvedAt: d.approved_at })));
            setMessages(mapToCamelCase(dataMap.messages, m => ({ id: m.id, chatId: m.chat_id, senderId: m.sender_id, body: m.body, createdAt: m.created_at, attachments: m.attachments })));
            setMilestones(mapToCamelCase(dataMap.milestones, m => ({ id: m.id, projectId: m.project_id, title: m.title, amountDisplay: m.amount_display, dueDate: m.due_date, statusDisplay: m.status_display, paidDateDisplay: m.paid_date_display })));
            setQuotes(mapToCamelCase(dataMap.quotes, q => ({ id: q.id, projectId: q.project_id, version: q.version, fileUrl: q.file_url, uploadedBy: q.uploaded_by, createdAt: q.created_at })));
            setActivityLogs(mapToCamelCase(dataMap.activity_logs, a => ({ id: a.id, projectId: a.project_id, actorId: a.actor_id, action: a.action, details: a.details, createdAt: a.created_at })));
            setSiteVisits(mapToCamelCase(dataMap.site_visits, sv => ({ id: sv.id, projectId: sv.project_id, scheduledAt: sv.scheduled_at, requestedBy: sv.requested_by, status: sv.status })));
            setSupportTickets(mapToCamelCase(dataMap.support_tickets, st => ({ id: st.id, submittedBy: st.submitted_by, projectId: st.project_id, subject: st.subject, message: st.message, status: st.status, createdAt: st.created_at })));
            setAttendanceLogs(mapToCamelCase(dataMap.attendance_logs, al => ({ id: al.id, designerId: al.designer_id, clockIn: al.clock_in, clockOut: al.clock_out, duration: al.duration, location: al.location, ipAddress: al.ip_address })));
            setLeaveRequests(mapToCamelCase(dataMap.leave_requests, lr => ({ id: lr.id, designerId: lr.designer_id, reason: lr.reason, startDate: lr.start_date, endDate: lr.end_date, status: lr.status })));
            setWorkLogs(mapToCamelCase(dataMap.work_logs, wl => ({ id: wl.id, designerId: wl.designer_id, projectId: wl.project_id, date: wl.date, tasksCompleted: wl.tasks_completed, hoursSpent: wl.hours_spent })));
            setProjectUpdates(mapToCamelCase(dataMap.project_updates, pu => ({ id: pu.id, projectId: pu.project_id, authorId: pu.author_id, message: pu.message, createdAt: pu.created_at })));
            setFinalGalleryImages(mapToCamelCase(dataMap.final_gallery_images, fgi => ({ id: fgi.id, projectId: fgi.project_id, url: fgi.url, caption: fgi.caption })));
            setExpenses(mapToCamelCase(dataMap.expenses, e => ({ id: e.id, projectId: e.project_id, description: e.description, amount: e.amount, date: e.date })));
            setProducts(mapToCamelCase(dataMap.products, p => ({ id: p.id, projectId: p.project_id, name: p.name, supplier: p.supplier, imageUrl: p.image_url, cost: p.cost, quantity: p.quantity, status: p.status })));
            setProjectTemplates(mapToCamelCase(dataMap.project_templates, pt => ({ id: pt.id, name: pt.name, description: pt.description, milestones: pt.milestones })));
            setAnnouncements(mapToCamelCase(dataMap.announcements, a => ({ id: a.id, authorId: a.author_id, content: a.content, target: a.target, createdAt: a.created_at })));
            setPosts(mapToCamelCase(dataMap.posts, p => ({...p, authorId: p.author_id, isPinned: p.is_pinned, projectId: p.project_id, postType: p.post_type, showcaseDetails: p.showcase_details, mediaUrl: p.media_url, mediaType: p.media_type, beforeMediaUrl: p.before_media_url, createdAt: p.created_at })));
            setFeedComments(mapToCamelCase(dataMap.feed_comments, fc => ({ id: fc.id, postId: fc.post_id, authorId: fc.author_id, content: fc.content, createdAt: fc.created_at })));

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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