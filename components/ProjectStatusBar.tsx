
import React from 'react';
import { ProjectStage } from '../types';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES } from '../constants';
import { CheckCircleIcon, ZapIcon } from './icons';

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  progress: number;
}

const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({ currentStage, progress }) => {
  const currentStageIndex = PROJECT_STAGES.indexOf(currentStage);

  return (
    <div className="w-full bg-slate-900 rounded-[32px] overflow-hidden relative shadow-premium animate-in mb-8">
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      
      <div className="p-8 sm:p-10 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-10 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[4px] opacity-80">Current Milestone</span>
            <h2 className="text-3xl font-display font-black text-white tracking-tight uppercase">
              {STAGE_DISPLAY_NAMES[currentStage]}
            </h2>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 min-w-[280px]">
            <div className="flex justify-between w-full text-[10px] font-black text-white/40 uppercase tracking-[3px]">
                <span>Total Evolution</span>
                <span className="text-brand-gold">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 flex items-center overflow-hidden ring-1 ring-white/10 shadow-inner">
              <div 
                className="bg-brand-gold h-full rounded-full transition-all duration-1000 shadow-gold-glow" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Architectural Phase Stepper */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-2">
          <div className="flex items-center min-w-[800px] justify-between relative px-4">
            {/* The Connecting Line */}
            <div className="absolute top-1/2 left-10 right-10 h-[1px] bg-white/10 -translate-y-1/2"></div>
            
            {PROJECT_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage} className="flex flex-col items-center relative z-10">
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 border-2 ${
                      isCompleted ? 'bg-brand-gold border-brand-gold text-slate-900' :
                      isCurrent ? 'bg-white border-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110' :
                      'bg-slate-800 border-white/10 text-white/30'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <span className="font-black text-xs">{index + 1}</span>
                    )}
                    
                    {isCurrent && (
                        <span className="absolute -inset-1 rounded-full border border-white/20 animate-ping"></span>
                    )}
                  </div>

                  <div className={`absolute top-full mt-4 text-center transition-all duration-300 w-32 ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                      <p className={`text-[9px] uppercase tracking-[1px] font-black leading-tight ${
                          isCompleted ? 'text-brand-gold' : 
                          isCurrent ? 'text-white' : 
                          'text-white/40'
                      }`}>
                          {STAGE_DISPLAY_NAMES[stage]}
                      </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStatusBar;
