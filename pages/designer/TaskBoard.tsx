import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { useData } from '../../context/DataContext';
import { updateRecord } from '../../services/api';
import TaskCard from '../../components/designer/TaskCard';

type TaskStatus = 'To Do' | 'In Progress' | 'For Review' | 'Done';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'For Review', 'Done'];

const TaskColumn: React.FC<{
  status: TaskStatus;
  tasks: Task[];
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ status, tasks, onDragStart, onDrop, onDragOver }) => {
  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
      className="bg-page-bg/80 rounded-xl w-72 flex-shrink-0"
    >
      <div className="p-4 border-b border-border-color">
        <h3 className="font-semibold text-text-primary">{status} <span className="text-sm font-normal text-text-secondary">({tasks.length})</span></h3>
      </div>
      <div className="p-3 space-y-3 h-full overflow-y-auto">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
};

const TaskBoard: React.FC = () => {
  const { user } = useAuth();
  const { tasks, refetchData, loading } = useData();

  const myTasks = useMemo(() => {
    return tasks.filter(task => task.assigneeId === user?.id);
  }, [tasks, user]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = myTasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      // Optimistic UI update can be done here if needed
      await updateRecord('tasks', taskId, { status: newStatus });
      await refetchData();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold font-display text-text-primary">Task Board</h1>
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={myTasks.filter(task => task.status === status)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
