import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { MOCK_PROJECTS, MOCK_DESIGNS, MOCK_QUOTES, MOCK_MILESTONES, MOCK_PROJECT_UPDATES, MOCK_WORK_LOGS, MOCK_ACTIVITY_LOGS, MOCK_FINAL_GALLERY_IMAGES, MOCK_PRODUCTS } from '../services/mockData';
import Card from '../components/ui/Card';
import { STAGE_DISPLAY_NAMES } from '../constants';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { FileTextIcon, UploadCloudIcon, ZapIcon, ClipboardIcon, SettingsIcon, MessageSquareIcon, AnnotationIcon, PackageIcon, CalendarIcon } from '../components/icons';
import { Project, Design, Quote, ProjectUpdate, User, ActivityLog, Comment, Product } from '../types';
import Modal from '../components/ui/Modal';
import ProjectStatusBar from '../components/ProjectStatusBar';
import ChatComponent from '../components/chat/ChatComponent';
import DesignAnnotationModal from '../components/design/DesignAnnotationModal';
import AddProductModal from '../components/designer/AddProductModal';
import ProjectGanttChart from '../components/customer/ProjectGanttChart';
import GeneratePOModal from '../components/designer/GeneratePOModal';
import { useUsers } from '../context/UserContext';
import UserNameDisplay from '../components/ui/UserNameDisplay';

type UnifiedUpdate = {
    id: string;
    type: 'update' | 'work_log' | 'system';
    author?: User;
    content: string;
    timestamp: string;
    hours?: number;
};

const ProjectDetails: React.FC = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    
    const [project, setProject] = useState<Project | undefined>(MOCK_PROJECTS.find(p => p.id === projectId));
    const [designs, setDesigns] = useState<Design[]>(MOCK_DESIGNS.filter(d => d.projectId === projectId));
    const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES.filter(q => q.projectId === projectId));
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS.filter(p => p.projectId === projectId));
    const [isFinalApprovalModalOpen, setFinalApprovalModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Live Updates');
    const [newUpdateMessage, setNewUpdateMessage] = useState('');
    const [isAnnotationModalOpen, setAnnotationModalOpen] = useState(false);
    const [selectedDesignForAnnotation, setSelectedDesignForAnnotation] = useState<Design | null>(null);
    const [isAddProductModalOpen, setAddProductModalOpen] = useState(false);
    const [isPOModalOpen, setPOModalOpen] = useState(false);
    
    const isProjectReadOnly = project?.status === 'Completed';
    
    const unifiedUpdateFeed = useMemo(() => {
        if (!projectId) return [];

        const updates: UnifiedUpdate[] = MOCK_PROJECT_UPDATES
            .filter(u => u.projectId === projectId)
            .map(u => ({
                id: u.id,
                type: 'update',
                author: findUserById(u.authorId),
                content: u.message,
                timestamp: u.createdAt
            }));
        
        const workLogs: UnifiedUpdate[] = MOCK_WORK_LOGS
            .filter(w => w.projectId === projectId)
            .map(w => ({
                id: w.id,
                type: 'work_log',
                author: findUserById(w.designerId),
                content: w.tasksCompleted,
                timestamp: new Date(w.date).toISOString(),
                hours: w.hoursSpent,
            }));

        const systemEvents: UnifiedUpdate[] = MOCK_ACTIVITY_LOGS
            .filter(a => a.projectId === projectId)
            .map(a => ({
                id: a.id,
                type: 'system',
                author: findUserById(a.actorId),
                content: a.details,
                timestamp: a.createdAt,
            }));
            
        return [...updates, ...workLogs, ...systemEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [projectId, findUserById]);
    
    const [feed, setFeed] = useState(unifiedUpdateFeed);


    useEffect(() => {
        const currentProject = MOCK_PROJECTS.find(p => p.id === projectId);
        setProject(currentProject);
        setDesigns(MOCK_DESIGNS.filter(d => d.projectId === projectId));
        setQuotes(MOCK_QUOTES.filter(q => q.projectId === projectId));
        setProducts(MOCK_PRODUCTS.filter(p => p.projectId === projectId));
        setFeed(unifiedUpdateFeed);
        
        const firstTab = (currentProject?.status === 'Completed' ? TABS[user!.role].includes('Final Gallery') ? 'Final Gallery' : 'Live Updates' : 'Live Updates')
        setActiveTab(firstTab);

    }, [projectId, unifiedUpdateFeed, user]);

    if (!project || !user || usersLoading) {
        return <div className="text-center text-text-headline">Project not found or user not loaded.</div>;
    }

    const designer = findUserById(project.designerId);
    const customer = findUserById(project.customerId);
    const projectMilestones = MOCK_MILESTONES.filter(m => m.projectId === project.id);

    const updateProjectState = (updates: Partial<Project>, actorId: string, actionDetails: string) => {
        const newTimestamp = new Date().toISOString();
        const updatedProject = { ...project, ...updates, updatedAt: newTimestamp };
        setProject(updatedProject);
    
        const projectIndex = MOCK_PROJECTS.findIndex(p => p.id === project.id);
        if (projectIndex > -1) {
            MOCK_PROJECTS[projectIndex] = updatedProject;
        }
    
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`,
            projectId: project.id,
            actorId: actorId,
            action: 'UPDATE_STATUS',
            details: actionDetails,
            createdAt: newTimestamp,
        };
        MOCK_ACTIVITY_LOGS.unshift(newLog);
    
        const newFeedEntry: UnifiedUpdate = {
            id: newLog.id,
            type: 'system',
            author: findUserById(actorId),
            content: newLog.details,
            timestamp: newLog.createdAt,
        };
        setFeed(prev => [newFeedEntry, ...prev]);
    };
    
    const handlePostUpdate = () => {
        if (!newUpdateMessage.trim() || !user || isProjectReadOnly) return;
        const newUpdate: ProjectUpdate = {
            id: `pu-${Date.now()}`,
            projectId: project.id,
            authorId: user.id,
            message: newUpdateMessage,
            createdAt: new Date().toISOString()
        };
        MOCK_PROJECT_UPDATES.push(newUpdate);
        
        const newFeedEntry: UnifiedUpdate = {
            id: newUpdate.id,
            type: 'update',
            author: user,
            content: newUpdate.message,
            timestamp: newUpdate.createdAt
        };
        setFeed(prev => [newFeedEntry, ...prev]);
        setNewUpdateMessage('');
    };

    const handleApproveDesign = (designId: string) => {
        setDesigns(designs.map(d => d.id === designId ? { ...d, approved: true } : d));
        if (project.stage === 'design_phase') {
            const details = `Approved a design concept. Project moved to: ${STAGE_DISPLAY_NAMES['awaiting_updated_quote']}.`;
            updateProjectState({ stage: 'awaiting_updated_quote', progress: 35 }, user.id, details);
        }
    };
    
    const handleSubmitForReapproval = (designId: string) => {
        setDesigns(designs.map(d => d.id === designId ? { ...d, submittedForReview: true, approved: false } : d));
        alert(`Design v${designs.find(d => d.id === designId)?.version} has been submitted to the client for re-approval.`);
    };

    const handleUploadUpdatedQuote = () => {
        const newQuote: Quote = {
            id: `quote-${Date.now()}`,
            projectId: project.id,
            version: 'final',
            fileUrl: 'dummy.pdf',
            uploadedBy: user.id,
            createdAt: new Date().toISOString(),
        };
        setQuotes(prev => [...prev, newQuote]);
        MOCK_QUOTES.push(newQuote);
        const details = `Uploaded the final quote. Project moved to: ${STAGE_DISPLAY_NAMES['material_selection']}.`;
        updateProjectState({ stage: 'material_selection', progress: 50 }, user.id, details);
    };

    const handleCompleteMaterialSelection = () => {
        const details = `Marked material selection complete. Project moved to: ${STAGE_DISPLAY_NAMES['execution']}.`;
        updateProjectState({ stage: 'execution', progress: 75 }, user.id, details);
    };

    const handleMarkProjectDone = () => {
        const details = `Marked project work as done. Project moved to: ${STAGE_DISPLAY_NAMES['awaiting_client_completion_approval']}.`;
        updateProjectState({ stage: 'awaiting_client_completion_approval', progress: 90 }, user.id, details);
    };

    const handleClientFinalApproval = () => {
        const details = `Client provided final approval. Project moved to: ${STAGE_DISPLAY_NAMES['awaiting_admin_completion_approval']}.`;
        updateProjectState({ stage: 'awaiting_admin_completion_approval', progress: 95 }, user.id, details);
        setFinalApprovalModalOpen(false);
    };

    const handleAdminFinalSignOff = () => {
        const details = `Admin gave final sign-off. Project is now complete!`;
        updateProjectState({ stage: 'completed', status: 'Completed', progress: 100 }, user.id, details);
    };
    
    const handleClientDiscussionRequest = () => {
        const details = `Client requested further discussion. Project reverted to: ${STAGE_DISPLAY_NAMES['execution']}.`;
        updateProjectState({ stage: 'execution', progress: 75 }, user.id, details);
        setFinalApprovalModalOpen(false);
    };
    
    const handleOpenAnnotationModal = (design: Design) => {
        setSelectedDesignForAnnotation(design);
        setAnnotationModalOpen(true);
    };

    const handleSaveComments = (designId: string, newComments: Comment[]) => {
        const designIndex = MOCK_DESIGNS.findIndex(d => d.id === designId);
        if (designIndex > -1) {
            MOCK_DESIGNS[designIndex].comments = newComments;
            MOCK_DESIGNS[designIndex].submittedForReview = false; // Require designer to re-submit
        }
        setDesigns(prev => prev.map(d => d.id === designId ? {...d, comments: newComments, submittedForReview: false} : d));
    };

    const handleCreateProduct = (newProductData: Omit<Product, 'id' | 'projectId'>) => {
        const productToAdd: Product = {
            ...newProductData,
            id: `prod-${Date.now()}`,
            projectId: project.id
        };
        MOCK_PRODUCTS.push(productToAdd);
        setProducts(prev => [...prev, productToAdd]);
        setAddProductModalOpen(false);
    };

    const handleCommentStatusChange = (commentId: string, designId: string, status: 'Open' | 'Resolved') => {
        const designIndex = MOCK_DESIGNS.findIndex(d => d.id === designId);
        if (designIndex > -1) {
            const commentIndex = MOCK_DESIGNS[designIndex].comments?.findIndex(c => c.id === commentId);
            if (commentIndex !== undefined && commentIndex > -1 && MOCK_DESIGNS[designIndex].comments) {
                MOCK_DESIGNS[designIndex].comments![commentIndex].status = status;
                // Force a re-render by updating state
                setDesigns([...MOCK_DESIGNS.filter(d => d.projectId === projectId)]);
            }
        }
    };

    const TABS: Record<User['role'], string[]> = {
        Customer: ['Live Updates', 'Timeline', 'Chat', 'Designs', 'Quotes & Docs', 'Milestones'],
        Designer: ['Live Updates', 'Chat', 'Designs', 'Sourcing', 'Feedback', 'Quotes & Docs', 'Milestones'],
        Admin: ['Live Updates', 'Chat', 'Designs', 'Sourcing', 'Quotes & Docs', 'Milestones'],
    };
    
    let tabs = TABS[user.role] || [];
    
    if (project.stage === 'completed') {
        const galleryTab = 'Final Gallery';
        if (!tabs.includes(galleryTab)) {
            tabs = [galleryTab, ...tabs];
        }
    }

    const totalSourcedCost = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);


    const renderTabContent = () => {
        switch (activeTab) {
            case 'Live Updates':
                const UpdateIcon = ({ type }: { type: UnifiedUpdate['type'] }) => {
                    const iconMap = {
                        update: <ZapIcon className="w-5 h-5 text-accent" />,
                        work_log: <ClipboardIcon className="w-5 h-5 text-blue-400" />,
                        system: <SettingsIcon className="w-5 h-5 text-purple-400" />,
                    };
                    return <div className="absolute left-[-1.6rem] top-1 bg-surface p-1.5 rounded-full">{iconMap[type]}</div>;
                };

                return (
                    <Card>
                        {user?.role === 'Designer' && !isProjectReadOnly && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-text-headline mb-2">Post a New Update</h2>
                                <div className="flex items-start gap-3">
                                    <img src={user.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />
                                    <div className="flex-1">
                                        <textarea 
                                            value={newUpdateMessage}
                                            onChange={(e) => setNewUpdateMessage(e.target.value)}
                                            placeholder={`Share an update on "${project.title}"...`}
                                            className="w-full bg-primary-bg border border-border-color rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-accent"
                                            rows={3}
                                        />
                                        <div className="text-right mt-2">
                                            <Button onClick={handlePostUpdate} disabled={!newUpdateMessage.trim()}>Post Update</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-text-headline mb-4">Update History</h2>
                        <div className="space-y-6">
                            {feed.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="flex-shrink-0">
                                        <img src={item.author?.avatarUrl} alt={item.author?.fullName} className="w-10 h-10 rounded-full"/>
                                    </div>
                                    <div className="flex-1 border-l-2 border-border-color pl-8 relative">
                                        <UpdateIcon type={item.type}/>
                                        <div className="flex items-center justify-between">
                                            <UserNameDisplay user={item.author} textClassName="font-bold text-text-headline" />
                                            <p className="text-xs text-text-muted">{new Date(item.timestamp).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-text-muted mt-1">{item.content}</p>
                                        {item.type === 'work_log' && (
                                            <div className="mt-2 text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded inline-block">
                                                Hours Logged: {item.hours}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
            case 'Timeline':
                return <ProjectGanttChart milestones={projectMilestones} startDate={project.startDate} />;
            case 'Chat':
                return <ChatComponent projectId={project.id} currentUser={user} isReadOnly={isProjectReadOnly}/>;
            case 'Designs':
                const hasOpenFeedback = (d: Design) => d.comments && d.comments.some(c => c.status === 'Open');
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {user?.role === 'Designer' && project.stage === 'design_phase' && !isProjectReadOnly && (
                            <Card className="flex flex-col items-center justify-center border-2 border-dashed border-border-color cursor-pointer hover:bg-primary-bg">
                                <UploadCloudIcon className="w-12 h-12 text-text-muted mb-2"/>
                                <p className="text-text-headline font-semibold">Upload New Design</p>
                                <p className="text-xs text-center">Supports up to 5 concepts</p>
                            </Card>
                        )}
                        {designs.map(d => (
                             <Card key={d.id}>
                                {d.type === 'image' ? (
                                    <img src={d.fileUrl} alt={`Design v${d.version}`} className="rounded-xl mb-4 aspect-video object-cover" />
                                ) : (
                                    <div className="rounded-xl mb-4 aspect-video bg-primary-bg flex items-center justify-center">
                                        <p className="text-text-headline">3D Model</p>
                                    </div>
                                )}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-text-headline">Version {d.version}</p>
                                        <p className="text-sm text-text-muted">{d.notes}</p>
                                    </div>
                                    <div className="text-xs text-right">
                                        {d.approved 
                                            ? <span className="text-green-400 font-semibold">Approved</span>
                                            : !d.submittedForReview
                                            ? <span className="text-purple-400">Changes Requested</span>
                                            : <span className="text-yellow-400">Awaiting Review</span>
                                        }
                                    </div>
                                </div>
                                {user?.role === 'Customer' && d.type === 'image' && d.submittedForReview && !isProjectReadOnly && (
                                     <Button variant="secondary" onClick={() => handleOpenAnnotationModal(d)} className="w-full mt-4 py-2 text-sm flex items-center justify-center gap-2">
                                        <AnnotationIcon className="w-4 h-4" />
                                        Annotate & Comment ({d.comments?.length || 0})
                                    </Button>
                                )}
                                {user?.role === 'Customer' && d.type === 'gltf' && d.submittedForReview && !isProjectReadOnly && (
                                    <Button variant="secondary" className="w-full mt-4 py-2 text-sm">View in 3D</Button>
                                )}

                                {user?.role === 'Customer' && project.stage === 'design_phase' && d.submittedForReview && !d.approved && !isProjectReadOnly && (
                                    <div className="mt-2 flex gap-2">
                                        <Button onClick={() => handleApproveDesign(d.id)} className="w-full py-2 text-sm">Approve</Button>
                                        <Button variant="secondary" className="w-full py-2 text-sm" onClick={() => handleOpenAnnotationModal(d)}>Request Changes</Button>
                                    </div>
                                )}
                                {user?.role === 'Designer' && hasOpenFeedback(d) && !d.submittedForReview && !isProjectReadOnly && (
                                    <Button onClick={() => handleSubmitForReapproval(d.id)} className="w-full mt-4 py-2 text-sm">Submit for Re-approval</Button>
                                )}
                             </Card>
                        ))}
                    </div>
                );
            case 'Sourcing':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-text-headline">Sourced Products</h2>
                                    {!isProjectReadOnly && <Button onClick={() => setAddProductModalOpen(true)}>+ Add Product</Button>}
                                </div>
                                <div className="space-y-3">
                                    {products.map(p => (
                                        <div key={p.id} className="bg-primary-bg p-3 rounded-xl flex items-center gap-4">
                                            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-lg object-cover" />
                                            <div className="flex-1">
                                                <p className="font-semibold text-text-headline">{p.name}</p>
                                                <p className="text-xs text-text-muted">{p.supplier}</p>
                                                <p className="text-sm font-mono text-accent mt-1">₹{p.cost.toLocaleString()} x {p.quantity}</p>
                                            </div>
                                            <div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    p.status === 'Delivered' ? 'bg-green-500/20 text-green-400' :
                                                    p.status === 'Ordered' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>{p.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {!isProjectReadOnly && (
                                    <Button onClick={() => setPOModalOpen(true)} variant="secondary" className="w-full mt-4">Generate Purchase Order</Button>
                                )}
                            </Card>
                        </div>
                        <div className="lg:col-span-1">
                            <Card>
                                <h2 className="text-xl font-bold text-text-headline mb-4">Budget Overview</h2>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between"><span>Total Budget:</span> <span className="font-semibold text-text-headline">₹{project.budgetDisplay.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span>Sourced Items:</span> <span className="font-semibold text-text-headline">- ₹{totalSourcedCost.toLocaleString()}</span></div>
                                    <div className="border-t border-border-color my-2"></div>
                                    <div className="flex justify-between text-base">
                                        <span className="font-bold text-text-headline">Remaining:</span>
                                        <span className={`font-bold ${project.budgetDisplay - totalSourcedCost < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                            ₹{(project.budgetDisplay - totalSourcedCost).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                );
             case 'Feedback':
                const allComments = designs.flatMap(d => d.comments?.map(c => ({...c, design: d})) || []);
                return (
                    <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Client Feedback</h2>
                        <div className="space-y-4">
                            {allComments.map(comment => {
                                const author = findUserById(comment.authorId);
                                return (
                                    <div key={comment.id} className="bg-primary-bg p-4 rounded-xl flex gap-4">
                                        <img src={comment.design.fileUrl} alt="design" className="w-24 h-24 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <UserNameDisplay user={author} textClassName="text-text-headline font-semibold" />
                                                    <p className="text-xs text-text-muted">on Design v{comment.design.version}</p>
                                                </div>
                                                <span className={`text-xs font-semibold ${comment.status === 'Open' ? 'text-yellow-400' : 'text-green-400'}`}>{comment.status}</span>
                                            </div>
                                            <p className="text-sm text-text-muted mt-2">{comment.text}</p>
                                            {comment.status === 'Open' && !isProjectReadOnly && (
                                                 <Button variant="secondary" onClick={() => handleCommentStatusChange(comment.id, comment.design.id, 'Resolved')} className="!px-3 !py-1 text-xs mt-2">Mark as Resolved</Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {allComments.length === 0 && <p className="text-text-muted">No feedback yet.</p>}
                        </div>
                    </Card>
                );
            case 'Quotes & Docs':
                return (
                     <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Quotes & Documents</h2>
                        <div className="space-y-3">
                            {quotes.map(q => (
                                <div key={q.id} className="bg-primary-bg p-4 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileTextIcon className="w-6 h-6 text-accent" />
                                        <div>
                                            <p className="font-semibold text-text-headline capitalize">{q.version} Quote</p>
                                            <p className="text-xs text-text-muted">Uploaded by {findUserById(q.uploadedBy)?.fullName} on {new Date(q.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="secondary" className="px-4 py-2 text-sm">Download</Button>
                                </div>
                            ))}
                        </div>
                        {user?.role === 'Designer' && project.stage === 'awaiting_updated_quote' && !isProjectReadOnly && (
                            <div className="mt-6">
                                 <Button onClick={handleUploadUpdatedQuote}>+ Upload Updated Quote</Button>
                            </div>
                        )}
                    </Card>
                );
            case 'Milestones':
                return (
                    <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Project Milestones</h2>

                        {/* Mobile View */}
                        <div className="md:hidden space-y-3">
                            {projectMilestones.map(milestone => (
                                <div key={milestone.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-text-headline">{milestone.title}</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            milestone.statusDisplay === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                            milestone.statusDisplay === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {milestone.statusDisplay}
                                        </span>
                                    </div>
                                    <p className="text-text-muted"><strong className="text-text-headline/80">Amount:</strong> ₹{milestone.amountDisplay.toLocaleString()}</p>
                                    <p className="text-text-muted"><strong className="text-text-headline/80">Due:</strong> {milestone.dueDate}</p>
                                    {user?.role === 'Admin' && milestone.statusDisplay !== 'Paid' && !isProjectReadOnly && (
                                        <Button variant="secondary" className="w-full mt-3 py-1 text-xs">Mark as Paid</Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Title</th>
                                        <th scope="col" className="px-6 py-3">Due Date</th>
                                        <th scope="col" className="px-6 py-3">Amount</th>
                                        <th scope="col" className="px-6 py-3">Status</th>
                                        {user?.role === 'Admin' && <th scope="col" className="px-6 py-3">Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {projectMilestones.map(milestone => (
                                        <tr key={milestone.id} className="border-b border-border-color">
                                            <td className="px-6 py-4 font-medium text-text-headline">{milestone.title}</td>
                                            <td className="px-6 py-4">{milestone.dueDate}</td>
                                            <td className="px-6 py-4">₹{milestone.amountDisplay.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    milestone.statusDisplay === 'Paid' ? 'bg-green-500/20 text-green-400' :
                                                    milestone.statusDisplay === 'Completed' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                    {milestone.statusDisplay}
                                                </span>
                                            </td>
                                            {user?.role === 'Admin' && (
                                                <td className="px-6 py-4">
                                                    {milestone.statusDisplay !== 'Paid' && !isProjectReadOnly && (
                                                        <Button variant="secondary" className="px-3 py-1 text-xs">Mark as Paid</Button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                );
             case 'Final Gallery':
                return (
                    <Card>
                        <h2 className="text-xl font-bold text-text-headline mb-4">Final Project Gallery</h2>
                        <p className="text-text-muted mb-6">A showcase of the completed "{project.title}" project.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {MOCK_FINAL_GALLERY_IMAGES.filter(img => img.projectId === project.id).map(image => (
                                <div key={image.id}>
                                    <img src={image.url} alt={image.caption} className="rounded-lg aspect-square object-cover" />
                                    <p className="text-sm text-center mt-2 text-text-muted">{image.caption}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    const renderHeaderActions = () => {
        if (isProjectReadOnly) return null;
        if (user?.role === 'Designer' && project.stage === 'material_selection') {
            return <Button onClick={handleCompleteMaterialSelection}>Mark Material Selection Complete</Button>
        }
        if (user?.role === 'Designer' && project.stage === 'execution') {
            return <Button onClick={handleMarkProjectDone}>Mark Project as Done</Button>
        }
        if (user?.role === 'Customer' && project.stage === 'awaiting_client_completion_approval') {
            return <Button onClick={() => setFinalApprovalModalOpen(true)}>Provide Final Approval</Button>
        }
        if (user?.role === 'Admin' && project.stage === 'awaiting_admin_completion_approval') {
            return <Button onClick={handleAdminFinalSignOff}>Final Project Sign-off</Button>
        }
        return null;
    }

    return (
        <>
            <Modal 
                isOpen={isFinalApprovalModalOpen} 
                onClose={() => setFinalApprovalModalOpen(false)}
                title="Final Project Approval"
            >
                <p className="text-text-muted mb-6">Please review the project. By approving, you are confirming that the project has been completed to your satisfaction.</p>
                <div className="flex justify-end gap-4">
                    <Button variant="secondary" onClick={handleClientDiscussionRequest}>Discuss Further</Button>
                    <Button onClick={handleClientFinalApproval}>Approve Completion</Button>
                </div>
            </Modal>
            
            {selectedDesignForAnnotation && (
                <DesignAnnotationModal
                    isOpen={isAnnotationModalOpen}
                    onClose={() => setAnnotationModalOpen(false)}
                    design={selectedDesignForAnnotation}
                    currentUser={user}
                    onSave={handleSaveComments}
                />
            )}
            
            <AddProductModal
                isOpen={isAddProductModalOpen}
                onClose={() => setAddProductModalOpen(false)}
                onCreate={handleCreateProduct}
            />
            
            <GeneratePOModal 
                isOpen={isPOModalOpen}
                onClose={() => setPOModalOpen(false)}
                products={products}
                project={project}
            />

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-headline">{project.title}</h1>
                        <div className="text-text-muted flex items-center gap-1">Customer: <UserNameDisplay user={customer} textClassName="text-text-muted" /></div>
                    </div>
                    {renderHeaderActions()}
                </div>

                <ProjectStatusBar currentStage={project.stage} progress={project.progress} />

                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        <div>
                            <h3 className="font-bold text-text-headline mb-1 uppercase tracking-wider text-xs">Description</h3>
                            <p className="text-text-muted">{project.description}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-headline mb-1 uppercase tracking-wider text-xs">Site Location</h3>
                            <p className="text-text-muted">{project.address}</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-text-headline mb-1 uppercase tracking-wider text-xs">Client Contact</h3>
                            <UserNameDisplay user={customer} textClassName="text-text-muted" />
                            <p className="text-text-muted">{customer?.userId || 'Not available'}</p>
                        </div>
                    </div>
                </Card>

                <div className="border-b border-border-color">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                                    ${activeTab === tab 
                                        ? 'border-accent text-accent' 
                                        : 'border-transparent text-text-muted hover:text-text-headline hover:border-text-muted'}`}
                            >
                                {tab === 'Timeline' && <CalendarIcon className="w-4 h-4" />}
                                {tab === 'Sourcing' && <PackageIcon className="w-4 h-4" />}
                                {tab === 'Feedback' && <AnnotationIcon className="w-4 h-4" />}
                                {tab === 'Live Updates' && <ZapIcon className="w-4 h-4" />}
                                {tab === 'Chat' && <MessageSquareIcon className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
                
                <div>{renderTabContent()}</div>
            </div>
        </>
    );
};

export default ProjectDetails;
