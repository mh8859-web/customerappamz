
import React, { useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { ZapIcon, ClockIcon, UserCircleIcon, ArrowPathIcon, ChevronRightIcon, PhotoIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';
import Button from '../../components/ui/Button';

const WorkTracking: React.FC = () => {
    const { currentWorks, loading } = useData();
    const { users, findUserById } = useUsers();
    const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(null);

    const designers = useMemo(() => {
        return users.filter(u => u.role === 'Designer');
    }, [users]);

    const selectedDesigner = useMemo(() => {
        return selectedDesignerId ? findUserById(selectedDesignerId) : null;
    }, [selectedDesignerId, findUserById]);

    const designerPulses = useMemo(() => {
        if (!selectedDesignerId) return [];
        return currentWorks
            .filter(w => w.designerId === selectedDesignerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentWorks, selectedDesignerId]);

    if (loading) return (
        <div className="p-24 text-center animate-pulse text-slate-400 font-black uppercase tracking-[8px] text-xs font-display">
            Initializing Intelligence Stream...
        </div>
    );

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            {/* Header Section */}
            <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
                <div>
                    <h1 className="text-5xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {selectedDesigner ? 'DESIGNER PROFILE' : 'DESIGNER PULSE'}
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[6px] text-[10px] mt-3 flex items-center gap-2">
                        <ZapIcon className="w-3.5 h-3.5 text-brand-gold" />
                        {selectedDesigner ? `Monitoring Productivity: ${selectedDesigner.fullName}` : 'High-Frequency Productivity Monitor'}
                    </p>
                </div>
                {selectedDesignerId && (
                    <Button 
                        variant="secondary" 
                        onClick={() => setSelectedDesignerId(null)}
                        className="!rounded-full !px-8 !py-3 !text-[10px] font-black uppercase tracking-widest shadow-soft"
                    >
                        <ArrowPathIcon className="w-4 h-4 mr-2" /> Back to Directory
                    </Button>
                )}
            </header>

            {/* Main View Logic */}
            {!selectedDesignerId ? (
                /* DESIGNER DIRECTORY VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in">
                    {designers.map(designer => {
                        const pulseCount = currentWorks.filter(w => w.designerId === designer.id).length;
                        return (
                            <Card 
                                key={designer.id}
                                className="luxury-glass !p-10 !rounded-[48px] border-slate-100 hover:border-brand-gold/30 hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden bg-white"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                
                                <div className="relative z-10 flex flex-col items-center text-center">
                                    <div className="relative mb-6">
                                        <img 
                                            src={designer.avatarUrl} 
                                            className="w-24 h-24 rounded-[32px] object-cover ring-4 ring-slate-50 shadow-soft group-hover:scale-105 transition-transform duration-500" 
                                            alt={designer.fullName} 
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-brand-gold text-slate-900 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                            <ZapIcon className="w-4 h-4" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight leading-none mb-2">
                                        {designer.fullName}
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px] mb-8">
                                        Creative Lead &bull; ID: {designer.userId}
                                    </p>

                                    <div className="w-full grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-3xl">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulses</p>
                                            <p className="text-lg font-display font-black text-slate-900">{pulseCount}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-3xl">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                                            <p className="text-lg font-display font-black text-brand-blue">A+</p>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => setSelectedDesignerId(designer.id)}
                                        className="w-full !rounded-2xl !py-4 !bg-slate-900 !text-[10px] font-black uppercase tracking-[3px] shadow-premium hover:shadow-gold-glow transition-all flex items-center justify-center gap-3 group"
                                    >
                                        Inspect Pulse <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                    {designers.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100">
                            <UserCircleIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[6px]">No Active Designers Registered</p>
                        </div>
                    )}
                </div>
            ) : (
                /* INDIVIDUAL STREAM VIEW */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in">
                    {/* Sidebar Profile Card */}
                    <div className="lg:col-span-4">
                        <Card className="luxury-glass !p-10 !rounded-[40px] border-slate-100 shadow-premium sticky top-24">
                            <img 
                                src={selectedDesigner?.avatarUrl} 
                                className="w-32 h-32 rounded-[40px] object-cover mb-8 ring-4 ring-slate-50 mx-auto shadow-premium" 
                                alt="" 
                            />
                            <div className="text-center space-y-2">
                                <h3 className="text-3xl font-display font-black text-slate-900 uppercase leading-none">{selectedDesigner?.fullName}</h3>
                                <p className="text-[10px] font-black text-brand-gold uppercase tracking-[5px]">{selectedDesigner?.role}</p>
                            </div>
                            
                            <div className="mt-10 pt-10 border-t border-slate-100 space-y-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Rank</span>
                                    <span className="text-sm font-black text-slate-900">#04 Elite</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Verified</span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-accent-success shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                </div>
                            </div>

                            <div className="mt-10 bg-slate-900 p-6 rounded-3xl text-center shadow-premium">
                                <p className="text-[9px] font-black text-white/40 uppercase tracking-[4px] mb-2">Total Sync Records</p>
                                <p className="text-3xl font-display font-black text-white">{designerPulses.length}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Main Pulse Feed */}
                    <div className="lg:col-span-8 space-y-8">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px] flex items-center gap-3">
                            <ZapIcon className="w-4 h-4 text-brand-gold" />
                            Activity Pipeline
                        </h2>
                        
                        <div className="space-y-6 relative">
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100"></div>
                            
                            {designerPulses.map((pulse) => (
                                <div key={pulse.id} className="relative pl-14 group">
                                    <div className="absolute left-[21px] top-6 w-1.5 h-1.5 bg-brand-gold rounded-full ring-4 ring-white shadow-sm z-10"></div>
                                    <Card className="luxury-glass !p-8 !rounded-[36px] border-slate-100 group-hover:border-brand-gold/20 transition-all hover:shadow-premium bg-white">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-slate-900 rounded-xl text-white">
                                                    <ClockIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                                                        {new Date(pulse.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {new Date(pulse.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {pulse.imageUrl && (
                                                <div className="px-3 py-1 bg-brand-gold/10 rounded-full text-[8px] font-black text-brand-gold uppercase tracking-[2px]">Visual Log Attached</div>
                                            )}
                                        </div>

                                        <p className="text-slate-700 text-lg leading-relaxed font-medium">"{pulse.content}"</p>
                                        
                                        {pulse.imageUrl && (
                                            <div className="mt-8 rounded-[32px] overflow-hidden shadow-inner ring-1 ring-slate-100 h-96 w-full relative group/img">
                                                <img src={pulse.imageUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-[2s]" alt="Update Visual" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"></div>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            ))}

                            {designerPulses.length === 0 && (
                                <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[48px]">
                                    <ZapIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="font-black uppercase tracking-[4px] text-xs">No records found for this unit.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkTracking;
