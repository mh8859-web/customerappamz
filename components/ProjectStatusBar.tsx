import React from 'react';
import { ProjectStage } from '../types';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES } from '../constants';
import { CheckCircleIcon } from './icons';
import Card from './ui/Card';

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  progress: number;
}

const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({ currentStage, progress }) => {
  const currentStageIndex = PROJECT_STAGES.indexOf(currentStage);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-lg font-bold text-text-headline mb-2 sm:mb-0">Project Status</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-32 bg-border-color rounded-full h-2.5">
            <div className="bg-brand-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-xl font-bold text-brand-blue">{progress}%</span>
        </div>
      </div>
      <div className="w-full">
        <div className="flex items-start">
          {PROJECT_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;

            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center flex-shrink-0" style={{width: `${100/PROJECT_STAGES.length}%`}}>
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500 ${
                      isCompleted ? 'bg-brand-blue text-white' :
                      isCurrent ? 'border-2 border-brand-blue bg-surface' :
                      'border-2 border-border-color bg-surface'
                    }`}
                  >
                    {isCurrent && <div className="absolute animate-ping h-full w-full rounded-full bg-brand-blue/75"></div>}
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <span className={`font-bold text-sm ${isCurrent ? 'text-brand-blue' : 'text-text-muted'}`}>{index + 1}</span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-xs text-center font-semibold transition-colors duration-500 ${
                        isCompleted || isCurrent ? 'text-text-headline' : 'text-text-muted'
                    }`}
                  >
                    {STAGE_DISPLAY_NAMES[stage]}
                  </p>
                </div>
                {index < PROJECT_STAGES.length - 1 && (
                  <div className={`flex-auto border-t-2 mt-4 transition-colors duration-500 ${
                    isCompleted ? 'border-brand-blue' : 'border-border-color'
                  }`}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ProjectStatusBar;