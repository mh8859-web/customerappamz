
import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { createRecord, updateRecord } from '../../services/api';
import { MegaphoneIcon, CheckCircleIcon, XMarkIcon, TrashIcon } from '../../components/icons';
import UserNameDisplay from '../../components/ui/UserNameDisplay';

const NotifyEmployees: React.FC = () => {
    const { users, loading: usersLoading } = useUsers();
    const { user: currentUser } = useAuth();
    const { systemNotifications, refetchData, loading: dataLoading } = useData();
    
    const [message, setMessage] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter out customers from the selection list, admins generally notify staff
    const staffUsers = useMemo(() => users.filter(u => u.role !== 'Customer'), [users]);

    const activeNotifications = useMemo(() => 
        systemNotifications
            .filter(n => n.isActive)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
    [systemNotifications]);

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const selectAll = () => {
        if (selectedUserIds.length === staffUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(staffUsers.map(u => u.id));
        }
    };

    const handleCreateNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || selectedUserIds.length === 0 || !currentUser) return;

        setIsSubmitting(true);
        try {
            const { error } = await createRecord('system_notifications', {
                message: message.trim(),
                target_user_ids: selectedUserIds,
                created_by: currentUser.id,
                is_active: true
            });

            if (error) throw error;

            setMessage('');
            setSelectedUserIds([]);
            await refetchData();
            alert("Notification broadcasted successfully.");
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseNotification = async (id: string) => {
        if(!window.confirm("Stop displaying this notification?")) return;
        await updateRecord('system_notifications', id, { is_active: false });
        await refetchData();
    };

    if (usersLoading || dataLoading) return <div className="p-20 text-center animate-pulse">Loading directory...</div>;

    return (
        <div className="space-y-10 pb-20">
            <header>
                <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase">Notify Employees</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[6px] text-xs mt-2">Internal Broadcast System</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Creation Form */}
                <div className="space-y-6">
                    <Card className="luxury-glass !p-8 rounded-[40px] border-slate-100 shadow-premium">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <MegaphoneIcon className="w-5 h-5 text-brand-gold" />
                            Compose Broadcast
                        </h2>
                        <form onSubmit={handleCreateNotification} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Message Content</label>
                                <textarea 
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="e.g. Server maintenance scheduled for 10 PM tonight."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue outline-none transition-all h-32 resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Audience</label>
                                    <button type="button" onClick={selectAll} className="text-[10px] font-bold text-brand-blue hover:underline">
                                        {selectedUserIds.length === staffUsers.length ? 'Deselect All' : 'Select All Staff'}
                                    </button>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar grid grid-cols-1 gap-1">
                                    {staffUsers.map(user => (
                                        <div 
                                            key={user.id} 
                                            onClick={() => toggleUserSelection(user.id)}
                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedUserIds.includes(user.id) ? 'bg-white shadow-sm ring-1 ring-brand-blue/20' : 'hover:bg-white/50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${selectedUserIds.includes(user.id) ? 'bg-brand-blue border-brand-blue' : 'border-slate-300'}`}>
                                                {selectedUserIds.includes(user.id) && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <UserNameDisplay user={user} showAvatar={true} imageSize="w-8 h-8" textClassName="text-xs font-bold text-slate-700" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase ml-auto tracking-wider">{user.role}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-right text-[10px] text-slate-400 mt-2 font-bold">{selectedUserIds.length} Recipients Selected</p>
                            </div>

                            <Button 
                                type="submit" 
                                disabled={isSubmitting || !message.trim() || selectedUserIds.length === 0}
                                className="w-full !rounded-full !py-4 !bg-slate-900 !text-[11px] font-black uppercase tracking-[4px] shadow-button"
                            >
                                {isSubmitting ? 'Broadcasting...' : 'Launch Notification'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Active Notifications List */}
                <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 ml-4">Active Feeds</h2>
                    <div className="space-y-4">
                        {activeNotifications.map(note => (
                            <Card key={note.id} className="relative group border-l-4 border-l-brand-blue">
                                <div className="pr-10">
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">"{note.message}"</p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(note.createdAt).toLocaleDateString()} &bull; {new Date(note.createdAt).toLocaleTimeString()}
                                        </p>
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold">
                                            {note.targetUserIds.length} Recipients
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleCloseNotification(note.id)}
                                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    title="Stop Notification"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </Card>
                        ))}
                        {activeNotifications.length === 0 && (
                            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] text-slate-300">
                                <MegaphoneIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">No active broadcasts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotifyEmployees;
