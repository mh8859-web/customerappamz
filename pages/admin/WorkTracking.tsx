
import React, { useMemo } from 'react';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { ZapIcon, ClockIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const WorkTracking: React.FC = () => {
    const { currentWorks, loading } = useData();
    const { findUserById } = useUsers();

    const sortedUpdates = useMemo(() => {
        return [...currentWorks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [currentWorks]);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Establishing data link...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <header>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">DESIGNER PULSE</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mt-1.5">Consolidated High-Frequency Productivity Stream</p>
            </header>

            <div className="space-y-6">
                {sortedUpdates.map((work) => {
                    const designer = findUserById(work.designerId);
                    return (
                        <Card key={work.id} className="luxury-glass border-slate-100 p-0 overflow-hidden group">
                            <div className="flex flex-col md:flex-row">
                                <div className="p-6 md:w-64 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <UserNameDisplay user={designer} showAvatar={true} textClassName="font-black text-slate-900 text-sm" imageSize="w-10 h-10" />
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <ClockIcon className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{new Date(work.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {new Date(work.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </div>
                                <div className="p-6 flex-1 bg-white">
                                    <p className="text-slate-700 text-lg leading-relaxed font-medium mb-4">{work.content}</p>
                                    {work.imageUrl && (
                                        <div className="relative group/img max-w-lg">
                                            <img src={work.imageUrl} className="rounded-xl w-full h-64 object-cover ring-1 ring-slate-100 transition-transform duration-500 group-hover/img:scale-[1.01]" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent rounded-xl opacity-0 group-hover/img:opacity-100 transition-opacity"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {sortedUpdates.length === 0 && (
                    <div className="py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[32px]">
                        <ZapIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-[4px] text-xs">Awaiting productivity stream data...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkTracking;
