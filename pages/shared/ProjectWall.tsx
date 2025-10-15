import React from 'react';
import Card from '../../components/ui/Card';
import { PhotoIcon } from '../../components/icons';

const ProjectWall: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display text-text-primary">Project Wall</h1>
      <Card>
        <div className="text-center py-12">
          <PhotoIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary">Coming Soon</h2>
          <p className="text-text-secondary mt-2">
            A beautiful gallery showcasing all your completed projects will be available here.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProjectWall;