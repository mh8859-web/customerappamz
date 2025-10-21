import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { WorkLog } from '../../types';
import { createRecord } from '../../services/api';

const DailyWork: React.FC = () => {
    const { user, projects, workLogs, refetchAllData, status } = useAppContext();
    
    const myLogs = useMemo(() => 
        workLogs.filter(log => log.designerId === user?.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workLogs, user]);
    
    const today = new Date().toISOString().split('T')[0];
    const [newLog, setNewLog] = useState({
        projectId: '',
        tasksCompleted: '',
        hoursSpent: '',
    });

    const assignedProjects = useMemo(() => 
        projects.filter(p => p.designerId === user?.id && p.status === 'Active'),
    [projects, user?.id]);
    
    const groupedLogs = useMemo(() => {
        return myLogs.reduce((acc: Record<string, WorkLog[]>, log) => {
            const date = new Date(log.date).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(log);
            return acc;
        }, {} as Record<string, WorkLog[]>);
    }, [myLogs]);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewLog(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLog.projectId || !newLog.tasksCompleted || !newLog.hoursSpent || !user) return;

        const logToAdd = {
            designer_id: user.id,
            project_id: newLog.projectId,
            date: today,
            tasks_completed: newLog.tasksCompleted,
            hours_spent: parseFloat(newLog.hoursSpent)
        };
        
        await createRecord('work_logs', logToAdd);
        await refetchAllData();

        // Reset form
        setNewLog({
            projectId: '',
            tasksCompleted: '',
            hoursSpent: '',
        });
    };
    
    const inputClasses = "w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-brand-blue";

    if (status !== 'authenticated') return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Daily Work Log</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Log Today's Work</h2>
                    <p className="text-sm text-text-muted mb-4">Date: {new Date(today).toLocaleDateString()}</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text-headline">Project</label>
                            <select name="projectId" value={newLog.projectId} onChange={handleInputChange} className={inputClasses} required>
                                <option value="" disabled>Select a project</option>
                                {assignedProjects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-headline">Tasks Completed</label>
                            <textarea name="tasksCompleted" value={newLog.tasksCompleted} onChange={handleInputChange} rows={4} className={inputClasses} placeholder="Describe what you worked on..." required />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-text-headline">Hours Spent</label>
                            <input type="number" name="hoursSpent" value={newLog.hoursSpent} onChange={handleInputChange} min="0.5" step="0.5" className={inputClasses} placeholder="e.g., 4.5" required />
                        </div>
                        <Button type="submit" className="w-full">Add Log Entry</Button>
                    </form>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Log History</h2>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                        {Object.keys(groupedLogs).map((date) => (
                            <div key={date}>
                                <h3 className="text-lg font-semibold text-text-headline mb-2">{date}</h3>
                                <div className="space-y-3 border-l-2 border-border-color pl-4">
                                {groupedLogs[date].map(log => {
                                    const project = projects.find(p => p.id === log.projectId);
                                    return (
                                    <div key={log.id} className="bg-primary-bg p-3 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-semibold text-text-headline">{project?.title}</p>
                                            <span className="text-sm font-mono text-brand-blue">{log.hoursSpent} hrs</span>
                                        </div>
                                        <p className="text-sm text-text-muted">{log.tasksCompleted}</p>
                                    </div>
                                    )
                                })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DailyWork;
