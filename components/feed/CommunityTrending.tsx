import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';
import Card from '../ui/Card';

interface CommunityTrendingProps {
  projects: Project[];
}

const CommunityTrending: React.FC<CommunityTrendingProps> = ({ projects }) => {
    const completedProjects = projects
        .filter(p => p.status === 'Completed')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-4 sticky top-24">
            <Card>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Recently Completed</h3>
                <div className="space-y-3">
                    {completedProjects.map(project => (
                        <Link key={project.id} to={`/projects/${project.id}`} className="block p-2 rounded-lg hover:bg-secondary">
                            <p className="font-semibold text-sm text-text-primary">{project.title}</p>
                            <p className="text-xs text-text-secondary">{project.address}</p>
                        </Link>
                    ))}
                    <Link to="/project-wall" className="text-sm font-semibold text-brand-blue hover:underline pt-2 block">
                        View Project Wall &rarr;
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default CommunityTrending;