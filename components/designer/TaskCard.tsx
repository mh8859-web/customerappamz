import React from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart }) => {
  const { projects } = useAppContext();
  const project = projects.find(p => p.id === task.projectId);
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0,0,0,0); // set to start of day for accurate comparison
  const isOverdue = dueDate < today && task.status !== 'Done';
  const isDueToday = dueDate.toDateString() === today.toDateString();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-surface p-3 rounded-xl border border-border-color cursor-grab active:cursor-grabbing"
    >
      <h4 className="text-sm font-semibold text-text-headline">{task.title}</h4>
      <p className="text-xs text-text-muted mt-1">{project?.title}</p>
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-xs px-2 py-0.5 rounded-md ${
            isOverdue ? 'bg-red-500/20 text-red-400' : 
            isDueToday ? 'bg-yellow-500/20 text-yellow-400' : 
            'bg-primary-bg'
        }`}>
            Due: {dueDate.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
