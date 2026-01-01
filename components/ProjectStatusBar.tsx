
import React, { useState } from 'react';
import { ProjectStage } from '../types';
import { PROJECT_STAGES, STAGE_DISPLAY_NAMES, STAGE_DESCRIPTIONS } from '../constants';
import { CheckCircleIcon, ChevronDownIcon, SparklesIcon } from './icons';

interface ProjectStatusBarProps {
  currentStage: ProjectStage;
  progress: number;
}

const ProjectStatusBar: React.FC<ProjectStatusBarProps> = ({ currentStage, progress }) => {
  const [activeInfoStage, setActiveInfoStage] = useState<ProjectStage | null>(currentStage);
  const currentStageIndex = PROJECT_STAGES.indexOf(currentStage);

  return (
    <div className="w-full bg-[#0F172A] rounded-[32px] overflow-hidden relative shadow-premium animate-in border border-white/5">
      {/* Refined glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
      
      <div className="p-6 sm:p-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-brand-gold uppercase tracking-[4px] opacity-70">Current Registry Phase</span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight uppercase leading-none">
              {STAGE_DISPLAY_NAMES[currentStage]}
            </h2>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 min-w-[280px]">
            <div className="flex justify-between w-full text-[9px] font-black text-white/40 uppercase tracking-[3px]">
                <span>Overall Evolution</span>
                <span className="text-brand-gold">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 flex items-center overflow-hidden">
              <div 
                className="bg-brand-gold h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* COMPACT Phase Pipeline */}
        <div className="relative pt-4 pb-4">
            <div className="overflow-x-auto no-scrollbar pb-10">
                <div className="flex items-center min-w-[1000px] justify-between relative px-16">
                    {/* Background Line */}
                    <div className="absolute top-[24px] left-20 right-20 h-[1px] bg-white/10"></div>
                    
                    {/* Active Line */}
                    <div 
                        className="absolute top-[24px] left-20 h-[1px] bg-brand-gold transition-all duration-1000 ease-in-out"
                        style={{ width: `calc(${Math.max(0, (currentStageIndex / (PROJECT_STAGES.length - 1)) * 100)}% - 40px)` }}
                    ></div>
                    
                    {PROJECT_STAGES.map((stage, index) => {
                        const isCompleted = index < currentStageIndex;
                        const isCurrent = index === currentStageIndex;
                        const isInfoActive = activeInfoStage === stage;

                        return (
                            <div key={stage} className="flex flex-col items-center relative z-10">
                                {/* Refined Small Circular Node */}
                                <button
                                    onClick={() => setActiveInfoStage(isInfoActive ? null : stage)}
                                    className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 border group ${
                                        isCompleted ? 'bg-brand-gold border-brand-gold text-[#0F172A]' :
                                        isCurrent ? 'bg-white border-white text-[#0F172A] shadow-gold-glow scale-110' :
                                        'bg-slate-800/40 border-white/10 text-white/20'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircleIcon className="h-6 w-6" />
                                    ) : (
                                        <span className="font-display font-black text-base">{index + 1}</span>
                                    )}
                                    
                                    {isCurrent && (
                                        <span className="absolute -inset-2 rounded-full border border-white/10 animate-ping"></span>
                                    )}
                                </button>

                                {/* Small Node Label */}
                                <div className={`absolute top-full mt-6 text-center transition-all duration-500 w-32 ${isCurrent ? 'opacity-100' : 'opacity-30'}`}>
                                    <p className={`text-[8px] font-black uppercase tracking-[3px] leading-relaxed ${
                                        isCompleted ? 'text-brand-gold' : 
                                        isCurrent ? 'text-white' : 
                                        'text-slate-500'
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

        {/* Compact Intelligence Card */}
        {activeInfoStage && (
            <div className="mt-4 pt-6 border-t border-white/5 animate-in slide-in-from-top-2">
                <div className="bg-white/5 p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center border border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-gold/10 flex items-center justify-center flex-shrink-0 text-brand-gold">
                        <SparklesIcon className="w-8 h-8" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                        <div>
                            <span className="text-[8px] font-black text-brand-gold uppercase tracking-[3px]">Phase Intel</span>
                            <h4 className="text-xl font-display font-black text-white uppercase tracking-tight">{STAGE_DESCRIPTIONS[activeInfoStage].title}</h4>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed text-sm opacity-90">{STAGE_DESCRIPTIONS[activeInfoStage].note}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex-shrink-0 min-w-[240px]">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[3px] mb-2">Monitor Status</p>
                        <p className="text-[10px] text-brand-gold font-black tracking-widest italic uppercase">
                            "{STAGE_DESCRIPTIONS[activeInfoStage].action}"
                        </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ProjectStatusBar;
