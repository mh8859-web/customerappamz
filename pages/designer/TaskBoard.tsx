
import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { useData } from '../../context/DataContext';
import { updateRecord, createRecord } from '../../services/api';
import TaskCard from '../../components/designer/TaskCard';
import { PlusIcon } from '../../components/icons';
import CreateTaskModal from '../../components/designer/CreateTaskModal';

type TaskStatus = 'To Do' | 'In Progress' | 'For Review' | 'Done';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'For Review', 'Done'];

const TaskColumn: React.FC<{
  status: TaskStatus;
  tasks: Task[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onAddTask?: () => void;
}> = ({ status, tasks, onDragStart, onDrop, onDragOver, onAddTask }) => {
  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
      className="bg-page-bg/80 rounded-xl w-72 flex-shrink-0 flex flex-col h-full"
    >
      <div className="p-4 border-b border-border-color flex justify-between items-center">
        <h3 className="font-semibold text-text-primary">{status} <span className="text-sm font-normal text-text-secondary">({tasks.length})</span></h3>
        {status === 'To Do' && onAddTask && (
            <button 
                onClick={onAddTask} 
                className="p-1.5 bg-brand-blue/10 hover:bg-brand-blue text-brand-blue hover:text-white rounded-full transition-all shadow-sm group"
                title="Create New Task"
            >
                <PlusIcon className="w-4 h-4" />
            </button>
        )}
      </div>
      <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}
        {tasks.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-xl min-h-[100px]">
                Empty
            </div>
        )}
      </div>
    </div>
  );
};

const TaskBoard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, projects, refetchData, loading } = useData();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const myTasks = useMemo(() => {
    return tasks.filter(task => task.assigneeId === user?.id);
  }, [tasks, user]);

  const activeProjects = useMemo(() => {
      return projects.filter(p => p.status === 'Active' && p.designerId === user?.id);
  }, [projects, user]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = myTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await updateRecord('tasks', taskId, { status: newStatus });
      await refetchData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCreateTask = async (taskData: any) => {
      await createRecord('tasks', {
          title: taskData.title,
          project_id: taskData.projectId,
          description: taskData.description,
          due_date: taskData.dueDate,
          assignee_id: taskData.assigneeId,
          status: 'To Do'
      });
      await refetchData();
  };
  
  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col pb-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-display text-text-primary">Task Board</h1>
      </div>
      
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-stretch">
        {COLUMNS.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={myTasks.filter(task => task.status === status)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onAddTask={status === 'To Do' ? () => setCreateModalOpen(true) : undefined}
          />
        ))}
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        projects={activeProjects}
        currentUser={user}
        onCreate={handleCreateTask}
      />
    </div>
  );
};

export default TaskBoard;
