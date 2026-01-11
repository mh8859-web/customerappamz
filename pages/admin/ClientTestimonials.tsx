
import React from 'react';
import Card from '../../components/ui/Card';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { VideoCameraIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const ClientTestimonials: React.FC = () => {
    const { testimonials, projects, loading: dataLoading } = useData();
    const { findUserById, loading: usersLoading } = useUsers();

    if (dataLoading || usersLoading) return <div className="p-20 text-center animate-pulse">Loading testimonials...</div>;

    const sortedTestimonials = [...testimonials].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Client Testimonials</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Voice of the Customer</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedTestimonials.map(t => {
                    const client = findUserById(t.clientId);
                    const project = projects.find(p => p.id === t.projectId);
                    
                    return (
                        <Card key={t.id} className="p-0 overflow-hidden rounded-[32px] group border-slate-100 hover:shadow-premium transition-all bg-white relative">
                            <div className="aspect-video bg-slate-900 relative">
                                <video src={t.videoUrl} controls className="w-full h-full object-cover" />
                            </div>
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">{project?.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                        <VideoCameraIcon className="w-5 h-5 text-slate-400" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img src={client?.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                                    <UserNameDisplay user={client} textClassName="font-bold text-slate-700 text-sm" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {sortedTestimonials.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[40px] text-slate-300">
                        <VideoCameraIcon className="w-16 h-16 mx-auto mb-6 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">No testimonials uploaded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientTestimonials;
