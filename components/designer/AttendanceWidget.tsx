
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { startClockIn, endClockOut } from '../../services/api';
import { ClockIcon, MapPinIcon } from '../icons';
import WorkLogPromptModal from './WorkLogPromptModal';

const AttendanceWidget: React.FC = () => {
    const { user } = useAuth();
    const { attendanceLogs, refetchData } = useData();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeLog, setActiveLog] = useState<any>(null);
    const [elapsed, setElapsed] = useState('00:00:00');
    const [isPromptOpen, setPromptOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Find if user has a session without a clock-out time
        const log = attendanceLogs.find(l => l.designerId === user?.id && !l.clockOut);
        setActiveLog(log);
    }, [attendanceLogs, user]);

    useEffect(() => {
        if (!activeLog) {
            setElapsed('00:00:00');
            return;
        }
        const timer = setInterval(() => {
            const start = new Date(activeLog.clockIn).getTime();
            const now = new Date().getTime();
            const diff = now - start;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeLog]);

    const handleClockIn = async () => {
        if (!user || isProcessing) return;
        setIsProcessing(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const loc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            const { error } = await startClockIn(user.id, new Date().toISOString(), loc, '0.0.0.0');
            if (error) {
                alert(`Authentication Error: ${error.message}`);
            } else {
                await refetchData();
            }
            setIsProcessing(false);
        }, (err) => {
            setIsProcessing(false);
            alert(`Location Required: ${err.message || 'Please enable GPS to clock in.'}`);
        }, { enableHighAccuracy: true });
    };

    const handleClockOut = async (summary: string) => {
        if (!activeLog || isProcessing) return;
        
        setIsProcessing(true);
        const { error } = await endClockOut(activeLog.id, new Date().toISOString(), elapsed, summary);
        
        if (error) {
            alert(`Database Sync Error: ${error.message}`);
            setIsProcessing(false);
        } else {
            // Success: Clean up UI state before refetching for better UX
            setPromptOpen(false);
            setActiveLog(null); // Optimistic clear
            await refetchData();
            setIsProcessing(false);
        }
    };

    return (
        <>
            <WorkLogPromptModal 
                isOpen={isPromptOpen} 
                onClose={() => handleClockOut('Shift terminated without explicit summary.')} 
                onSubmit={handleClockOut} 
            />
            <Card className="luxury-glass border-brand-gold/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ClockIcon className="w-24 h-24 text-brand-gold" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Shift Registry</h3>
                            <p className="text-2xl font-display font-black text-slate-900 mt-1">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${activeLog ? 'bg-accent-success/10 text-accent-success' : 'bg-slate-100 text-slate-400'}`}>
                            {activeLog ? 'ON DUTY' : 'OFF DUTY'}
                        </div>
                    </div>

                    {activeLog ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-500">
                                <MapPinIcon className="w-4 h-4 text-brand-gold" />
                                <span className="text-xs font-bold uppercase tracking-wider">{activeLog.location}</span>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-6 text-center shadow-premium ring-1 ring-white/10">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[4px] mb-2">Duration Today</p>
                                <p className="text-4xl font-display font-black text-white tracking-tighter">{elapsed}</p>
                            </div>
                            <Button 
                                variant="danger" 
                                onClick={() => setPromptOpen(true)} 
                                className="w-full !py-4 uppercase tracking-[3px] !text-[11px] !font-black"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'TERMINATING...' : 'Terminate Shift'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">System ready for authorization. Geolocation must be active to initiate the session.</p>
                            <Button 
                                variant="gold" 
                                onClick={handleClockIn} 
                                className="w-full !py-4 uppercase tracking-[3px] !text-[11px] !font-black"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'AUTHENTICATING...' : 'Authenticate & Clock In'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </>
    );
};

export default AttendanceWidget;
