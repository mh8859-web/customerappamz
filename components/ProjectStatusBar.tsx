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
    <Card className="!bg-brand-dark !text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold"></div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 px-2">
        <div>
          <h2 className="text-lg font-display font-bold text-white mb-0.5">Project Trajectory</h2>
          <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">Current Phase: {STAGE_DISPLAY_NAMES[currentStage]}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex-1 sm:w-48 bg-white/10 rounded-full h-1.5">
            <div className="bg-brand-gold h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="text-2xl font-display font-bold text-brand-gold">{progress}%</span>
        </div>
      </div>
      
      <div className="w-full px-2">
        <div className="flex items-start">
          {PROJECT_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;

            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center flex-shrink-0" style={{width: `${100/PROJECT_STAGES.length}%`}}>
                  <div
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-brand-gold text-brand-dark' :
                      isCurrent ? 'border-2 border-brand-gold bg-brand-dark shadow-gold-glow' :
                      'border border-white/10 bg-white/5'
                    }`}
                  >
                    {isCurrent && <div className="absolute animate-ping h-full w-full rounded-full bg-brand-gold/30"></div>}
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <span className={`font-bold text-xs ${isCurrent ? 'text-brand-gold' : 'text-white/20'}`}>{index + 1}</span>
                    )}
                  </div>
                  <p
                    className={`mt-3 text-[10px] uppercase tracking-tighter leading-tight text-center font-bold transition-colors duration-500 ${
                        isCompleted || isCurrent ? 'text-white' : 'text-white/20'
                    }`}
                  >
                    {STAGE_DISPLAY_NAMES[stage].split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                  </p>
                </div>
                {index < PROJECT_STAGES.length - 1 && (
                  <div className={`flex-auto border-t mt-4.5 transition-colors duration-700 ${
                    isCompleted ? 'border-brand-gold' : 'border-white/10'
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