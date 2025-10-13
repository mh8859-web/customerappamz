import React, { useMemo } from 'react';
import { Milestone } from '../../types';
import Card from '../ui/Card';

interface ProjectGanttChartProps {
  milestones: Milestone[];
  startDate: string;
}

const ProjectGanttChart: React.FC<ProjectGanttChartProps> = ({ milestones, startDate }) => {

  const { chartData, totalDuration } = useMemo(() => {
    if (!milestones.length) return { chartData: [], totalDuration: 0 };

    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const projectStartDate = new Date(startDate);
    const projectEndDate = new Date(sortedMilestones[sortedMilestones.length - 1].dueDate);
    
    // Calculate total duration in days
    const totalDuration = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24)) + 1;
    
    const chartData = sortedMilestones.map(milestone => {
      const dueDate = new Date(milestone.dueDate);
      const offset = Math.ceil((dueDate.getTime() - projectStartDate.getTime()) / (1000 * 3600 * 24));
      
      const leftPercentage = (offset / totalDuration) * 100;
      
      return {
        ...milestone,
        left: Math.max(0, Math.min(100, leftPercentage)),
      };
    });

    return { chartData, totalDuration };
  }, [milestones, startDate]);


  return (
    <Card>
      <h2 className="text-xl font-bold text-text-headline mb-4">Project Timeline</h2>
      <p className="text-sm text-text-muted mb-6">A visual overview of key project dates and milestones.</p>
      
      <div className="space-y-6">
        {chartData.map((milestone, index) => (
          <div key={milestone.id}>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-semibold text-text-headline">{milestone.title}</span>
                <span className="text-text-muted">{new Date(milestone.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="relative w-full h-8 bg-primary-bg rounded-lg">
                <div 
                    className="absolute top-0 h-full bg-accent/20 rounded-lg"
                    style={{ left: `0%`, width: `${milestone.left}%` }}
                ></div>
                <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent rounded-full border-2 border-primary-bg shadow-soft"
                    style={{ left: `calc(${milestone.left}% - 8px)` }}
                ></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ProjectGanttChart;
