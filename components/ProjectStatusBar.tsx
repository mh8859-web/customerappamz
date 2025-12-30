
import React from 'react';
import { ProjectStage } from '../types';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES } from '../constants';
import { CheckCircleIcon, ZapIcon } from './icons';
import Card from './ui/Card';

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  progress: number;
}

const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({ currentStage, progress }) => {
  const currentStageIndex = PROJECT_STAGES.indexOf(currentStage);

  return (
    <Card className="!p-0 !bg-slate-900 border-none overflow-hidden relative shadow-premium group animate-in">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold/0 via-brand-gold to-brand-gold/0 opacity-40"></div>
      <div className="absolute -right-32 -top-32 w-80 h-80 bg-brand-gold/10 rounded-full blur-[100px] group-hover:bg-brand-gold/20 transition-all duration-1000"></div>

      <div className="p-8 sm:p-12 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10 mb-14">
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
                <div className="h-[1px] w-12 bg-brand-gold/40"></div>
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-[5px] opacity-80">Phase Evolution</span>
            </div>
            <h2 className="text-5xl font-display font-light text-white tracking-tighter leading-tight">
              Project <span className="font-black italic text-brand-gold drop-shadow-sm">Tracker</span>
            </h2>
            <div className="flex items-center gap-3">
                <div className="bg-brand-gold/20 p-1 rounded-full">
                    <ZapIcon className="w-4 h-4 text-brand-gold animate-pulse" />
                </div>
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-[3px]">
                    Current Status: <span className="text-white/90 font-black">{STAGE_DISPLAY_NAMES[currentStage]}</span>
                </p>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4 min-w-[320px]">
            <div className="flex justify-between w-full text-[10px] font-black text-white/50 uppercase tracking-[3px]">
                <span>Total Milestones Reached</span>
                <span className="text-brand-gold font-black">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-4 p-1 flex items-center overflow-hidden ring-1 ring-white/10 shadow-inner">
              <div 
                className="bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light h-2 rounded-full transition-all duration-1000 ease-out animate-glow-pulse shadow-gold-glow" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Architectural Phase Stepper */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-6 -mx-2 px-2">
          <div className="flex items-start min-w-[900px] justify-between relative px-10">
            {/* Connecting Track Background */}
            <div className="absolute top-6 left-10 right-10 h-[1px] bg-white/10 z-0"></div>
            
            {PROJECT_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div key={stage} className="flex flex-col items-center relative z-10">
                  {/* The Milestone Indicator */}
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isCompleted ? 'bg-brand-gold text-slate-900 rotate-[15deg] scale-110' :
                      isCurrent ? 'bg-white text-slate-900 shadow-[0_0_35px_rgba(255,255,255,0.3)] scale-[1.3] -translate-y-1' :
                      'border border-white/10 bg-slate-800/50 text-white/30'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-7 w-7" />
                    ) : (
                      <span className="font-black text-xs tracking-tighter">{index + 1}</span>
                    )}
                  </div>

                  {/* Text Label */}
                  <div className={`mt-6 text-center transition-all duration-500 max-w-[120px] ${isCurrent ? 'scale-110' : ''}`}>
                      <p className={`text-[10px] uppercase tracking-[2px] font-black leading-tight ${
                          isCompleted ? 'text-brand-gold/70' : 
                          isCurrent ? 'text-white' : 
                          'text-white/20'
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
    </Card>
  );
};

export default ProjectStatusBar;
