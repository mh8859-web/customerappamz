
import React from 'react';
import { ProjectStage } from '../types';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES } from '../constants';
import { CheckCircleIcon } from './icons';

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  progress: number;
}

const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({ currentStage, progress }) => {
  const currentStageIndex = PROJECT_STAGES.indexOf(currentStage);

  return (
    <div className="w-full bg-slate-900 rounded-[32px] overflow-hidden relative shadow-premium animate-in mb-8 border border-white/10">
      {/* Subtle Glow Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      
      <div className="p-8 sm:p-10 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-8 mb-12 pb-8 border-b border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-brand-gold uppercase tracking-[4px] opacity-90">Current Project Phase</span>
            <h2 className="text-4xl font-display font-black text-white tracking-tight uppercase drop-shadow-md">
              {STAGE_DISPLAY_NAMES[currentStage]}
            </h2>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 min-w-[280px]">
            <div className="flex justify-between w-full text-[10px] font-black text-white/60 uppercase tracking-[3px]">
                <span>Overall Evolution</span>
                <span className="text-brand-gold font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 flex items-center overflow-hidden ring-1 ring-white/10">
              <div 
                className="bg-brand-gold h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(212,175,55,0.7)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Architectural Phase Stepper - Hidden Scrollbars Guaranteed */}
        <div className="w-full overflow-x-auto no-scrollbar pb-10 pt-4 cursor-grab active:cursor-grabbing">
          <div className="flex items-center min-w-[1200px] justify-between relative px-20">
            {/* The Connecting Line */}
            <div className="absolute top-[28px] left-24 right-24 h-[2px] bg-white/10"></div>
            
            {PROJECT_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage} className="flex flex-col items-center relative z-10">
                  <div
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-700 border-2 shadow-lg ${
                      isCompleted ? 'bg-brand-gold border-brand-gold text-slate-900 scale-90' :
                      isCurrent ? 'bg-white border-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-110' :
                      'bg-slate-800 border-white/20 text-white/40'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-7 w-7" />
                    ) : (
                      <span className="font-black text-sm">{index + 1}</span>
                    )}
                    
                    {isCurrent && (
                        <span className="absolute -inset-2 rounded-full border-2 border-white/30 animate-ping"></span>
                    )}
                  </div>

                  <div className={`absolute top-full mt-6 text-center transition-all duration-300 w-40 ${isCurrent ? 'opacity-100' : 'opacity-60'}`}>
                      <p className={`text-[10px] uppercase tracking-[2px] font-black leading-snug break-words ${
                          isCompleted ? 'text-brand-gold' : 
                          isCurrent ? 'text-white' : 
                          'text-slate-400'
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
