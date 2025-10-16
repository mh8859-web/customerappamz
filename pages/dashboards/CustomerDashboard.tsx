import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_PROJECTS, MOCK_MILESTONES, MOCK_ANNOUNCEMENTS } from '../../services/mockData';
import { Project, Milestone } from '../../types';
import Card from '../../components/ui/Card';
import PaymentModal from '../../components/customer/PaymentReminderModal';
import TestimonialFlow from '../../components/dashboard/TestimonialFlow';
// FIX: Removed unused icons
import { DownloadIcon, MegaphoneIcon } from '../../components/icons';
import Button from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { useUsers } from '../../context/UserContext';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const CustomerDashboard: React.FC = () => {
    const { user } = useAuth();
    const { findUserById, loading: usersLoading } = useUsers();
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

    const { project, milestones, designer, admin } = useMemo(() => {
        if (!user) return { project: null, milestones: [], designer: null, admin: null };
        const myProject = MOCK_PROJECTS.find(p => p.customerId === user.id && p.status === 'Active');
        const projectMilestones = myProject ? MOCK_MILESTONES.filter(m => m.projectId === myProject.id) : [];
        const projectDesigner = myProject ? findUserById(myProject.designerId) : null;
        const projectAdmin = myProject ? findUserById(myProject.adminId) : null;
        return { project: myProject, milestones: projectMilestones, designer: projectDesigner, admin: projectAdmin };
    }, [user, findUserById]);
    
    const completedProject = useMemo(() => {
        if (!user) return null;
        return MOCK_PROJECTS.find(p => p.customerId === user.id && p.status === 'Completed' && p.stage === 'completed');
    }, [user]);
    
    const latestAnnouncement = MOCK_ANNOUNCEMENTS
      .filter(a => a.target === 'Customers' || a.target === 'All')
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    useEffect(() => {
        const reminderMilestone = milestones.find(m => m.statusDisplay === 'Completed');
        if (reminderMilestone) {
            setSelectedMilestone(reminderMilestone);
            setPaymentModalOpen(true);
        }
    }, [milestones]);
    
    const handlePayNow = (milestone: Milestone) => {
        setSelectedMilestone(milestone);
        setPaymentModalOpen(true);
    };

    const handlePaymentComplete = (milestoneId: string) => {
        const milestoneIndex = MOCK_MILESTONES.findIndex(m => m.id === milestoneId);
        if(milestoneIndex > -1){
            MOCK_MILESTONES[milestoneIndex].statusDisplay = 'Paid';
            MOCK_MILESTONES[milestoneIndex].paidDateDisplay = new Date().toISOString().split('T')[0];
        }
        // Force re-render by creating a new object
        // In a real app, this would trigger a re-fetch
    };

    if (completedProject) {
        return <TestimonialFlow project={completedProject} />;
    }

    if (!project) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold text-text-headline">Welcome, {user?.fullName}!</h1>
                <p className="text-text-muted">You do not have any active projects at the moment.</p>
                <Button className="mt-4" onClick={() => window.location.hash = '/projects'}>View Archived Projects</Button>
            </div>
        );
    }
    
    const totalPaid = milestones.filter(m => m.statusDisplay === 'Paid').reduce((sum, m) => sum + m.amountDisplay, 0);

    return (
        <>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                milestone={selectedMilestone}
                onPaymentSuccess={handlePaymentComplete}
            />
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-text-headline">Welcome, {user?.fullName.split(' ')[0]}!</h1>
                 
                 {latestAnnouncement && (
                    <Card className="!p-4 bg-accent/10 border-accent/30 flex items-start gap-3">
                        <MegaphoneIcon className="w-5 h-5 text-accent flex-shrink-0 mt-1"/>
                        <div>
                            <h3 className="font-bold text-accent">An Update from AMAZ Interiors</h3>
                            <p className="text-sm text-text-headline">{latestAnnouncement.content}</p>
                        </div>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <h2 className="text-xl font-semibold text-text-headline mb-4">Project: {project.title}</h2>
                            <p className="text-sm text-text-muted mb-4">{project.description}</p>
                            <div className="text-right">
                                <Link to={`/projects/${project.id}`}>
                                    <Button>View Project Details</Button>
                                </Link>
                            </div>
                        </Card>
                         <Card>
                            <h2 className="text-xl font-semibold text-text-headline mb-4">Financial Overview</h2>
                             <div className="flex items-center gap-6">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4A5568" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4FD1C5" strokeWidth="3" strokeDasharray={`${(totalPaid / project.budgetDisplay) * 100}, 100`} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-lg font-bold text-text-headline">{Math.round((totalPaid / project.budgetDisplay) * 100)}%</span>
                                        <span className="text-xs text-text-muted">Paid</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-text-muted">Total Paid: <span className="font-bold text-text-headline">₹{totalPaid.toLocaleString()}</span></p>
                                    <p className="text-text-muted">Total Budget: <span className="font-bold text-text-headline">₹{project.budgetDisplay.toLocaleString()}</span></p>
                                </div>
                             </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <h2 className="text-xl font-semibold text-text-headline mb-4">My Project Team</h2>
                            <div className="space-y-3">
                                {designer && (
                                    <div className="flex items-center gap-3">
                                        <img src={designer.avatarUrl} alt={designer.fullName} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <UserNameDisplay user={designer} textClassName="font-semibold text-text-headline" />
                                            <p className="text-sm text-text-muted">Lead Designer</p>
                                        </div>
                                    </div>
                                )}
                                {admin && (
                                     <div className="flex items-center gap-3">
                                        <img src={admin.avatarUrl} alt={admin.fullName} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <UserNameDisplay user={admin} textClassName="font-semibold text-text-headline" />
                                            <p className="text-sm text-text-muted">Project Admin</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                         <Card>
                            <h2 className="text-xl font-semibold text-text-headline mb-4">Key Documents</h2>
                            <div className="space-y-2">
                                <Button variant="secondary" className="w-full !justify-start !p-2 text-sm flex gap-2"><DownloadIcon className="w-4 h-4"/> Initial Quote</Button>
                                <Button variant="secondary" className="w-full !justify-start !p-2 text-sm flex gap-2"><DownloadIcon className="w-4 h-4"/> Final Approved Quote</Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerDashboard;