
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
    <Card className="!p-0 !bg-slate-900 border-none overflow-hidden relative shadow-premium group">
      {/* Decorative Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-gold/0 via-brand-gold to-brand-gold/0 opacity-50"></div>
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-all duration-700"></div>

      <div className="p-8 sm:p-10 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-8 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
                <div className="h-px w-8 bg-brand-gold/50"></div>
                <span className="text-[10px] font-black text-brand-gold uppercase tracking-[4px]">Real-Time Tracking</span>
            </div>
            <h2 className="text-4xl font-display font-light text-white tracking-tighter leading-none">
              Project <span className="font-black italic text-brand-gold">Trajectory</span>
            </h2>
            <div className="flex items-center gap-2 pt-1">
                <ZapIcon className="w-3.5 h-3.5 text-brand-gold animate-pulse" />
                <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                    Currently in <span className="text-white/80">{STAGE_DISPLAY_NAMES[currentStage]}</span>
                </p>
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 min-w-[280px]">
            <div className="flex justify-between w-full text-[10px] font-black text-white/40 uppercase tracking-[2px]">
                <span>Overall Completion</span>
                <span className="text-brand-gold">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3 p-1 flex items-center overflow-hidden ring-1 ring-white/10">
              <div 
                className="bg-gradient-to-r from-brand-gold-dark via-brand-gold to-brand-gold-light h-1 rounded-full transition-all duration-1000 ease-out shadow-gold-glow" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Phase Stepper */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-4 -mx-2 px-2">
          <div className="flex items-start min-w-[800px]">
            {PROJECT_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <React.Fragment key={stage}>
                  <div className="flex flex-col items-center flex-1 relative">
                    {/* The Dot */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-700 ${
                        isCompleted ? 'bg-brand-gold text-slate-900 rotate-12 scale-110' :
                        isCurrent ? 'bg-white text-slate-900 shadow-[0_0_25px_rgba(212,175,55,0.4)] scale-125' :
                        'border border-white/10 bg-white/5 text-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircleIcon className="h-6 w-6" />
                      ) : (
                        <span className="font-black text-xs">{index + 1}</span>
                      )}
                    </div>

                    {/* Label */}
                    <div className="mt-5 text-center px-2">
                        <p className={`text-[10px] uppercase tracking-widest font-black transition-all duration-500 whitespace-pre-wrap max-w-[100px] leading-tight ${
                            isCompleted ? 'text-brand-gold/80' : 
                            isCurrent ? 'text-white scale-110 origin-top' : 
                            'text-white/20'
                        }`}>
                            {STAGE_DISPLAY_NAMES[stage]}
                        </p>
                    </div>

                    {/* Connecting Line (drawn after the dot) */}
                    {index < PROJECT_STAGES.length - 1 && (
                      <div className="absolute left-[calc(50%+20px)] right-[-50%] top-5 h-px z-0">
                        <div className={`w-full h-full transition-all duration-1000 ${
                          isCompleted ? 'bg-brand-gold' : 'bg-white/10'
                        }`}></div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectStatusBar;
