import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MOCK_TASKS, MOCK_PROJECTS } from '../../services/mockData';
import { Task } from '../../types';
import TaskCard from '../../components/designer/TaskCard';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Card from '../../components/ui/Card';

type TaskStatus = 'To Do' | 'In Progress' | 'For Review' | 'Done';

const TaskBoard: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS.filter(t => t.assigneeId === user?.id));
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    const [newTask, setNewTask] = useState({
        title: '',
        projectId: '',
        dueDate: ''
    });

    const columns: TaskStatus[] = ['To Do', 'In Progress', 'For Review', 'Done'];

    const tasksByColumn = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = {
            'To Do': [],
            'In Progress': [],
            'For Review': [],
            'Done': []
        };
        tasks.forEach(task => {
            grouped[task.status].push(task);
        });
        return grouped;
    }, [tasks]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData("taskId", taskId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        const taskId = e.dataTransfer.getData("taskId");
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId ? { ...task, status } : task
            )
        );
        // Also update mock data to persist state across navigation
        const taskIndex = MOCK_TASKS.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            MOCK_TASKS[taskIndex].status = status;
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if(!user || !newTask.title || !newTask.projectId || !newTask.dueDate) return;

        const taskToAdd: Task = {
            id: `task-${Date.now()}`,
            title: newTask.title,
            projectId: newTask.projectId,
            assigneeId: user.id,
            status: 'To Do',
            dueDate: newTask.dueDate,
        };

        MOCK_TASKS.push(taskToAdd);
        setTasks(prev => [...prev, taskToAdd]);
        setCreateModalOpen(false);
        setNewTask({ title: '', projectId: '', dueDate: '' });
    };

    return (
        <>
            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Task">
                 <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-headline mb-1">Task Title</label>
                        <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-headline mb-1">Project</label>
                        <select value={newTask.projectId} onChange={e => setNewTask({...newTask, projectId: e.target.value})} className="w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" required>
                            <option value="" disabled>Select a project</option>
                            {MOCK_PROJECTS.filter(p => p.designerId === user?.id).map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-headline mb-1">Due Date</label>
                        <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" required />
                    </div>
                    <div className="flex justify-end pt-4 gap-3">
                        <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Task</Button>
                    </div>
                </form>
            </Modal>
            <div className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <h1 className="text-3xl font-bold text-text-headline">My Task Board</h1>
                    <Button onClick={() => setCreateModalOpen(true)}>+ Create Task</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    {columns.map(status => (
                        <div
                            key={status}
                            onDrop={(e) => handleDrop(e, status)}
                            onDragOver={handleDragOver}
                            className="bg-primary-bg p-3 rounded-xl min-h-[200px]"
                        >
                            <h3 className="font-bold text-text-headline mb-3 flex justify-between items-center">
                                {status}
                                <span className="text-sm font-normal bg-surface px-2 py-0.5 rounded-full">{tasksByColumn[status].length}</span>
                            </h3>
                            <div className="space-y-3">
                                {tasksByColumn[status].map(task => (
                                    <TaskCard key={task.id} task={task} onDragStart={handleDragStart} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default TaskBoard;