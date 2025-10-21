import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import { ChevronDownIcon } from '../../components/icons';

const MyCalendar: React.FC = () => {
    const { user, tasks, siteVisits, leaveRequests, status } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());

    const events = useMemo(() => {
        if (!user || status !== 'authenticated') return [];
        
        const taskEvents = tasks
            .filter(t => t.assigneeId === user.id)
            .map(t => ({ date: new Date(t.dueDate), title: t.title, type: 'task' as const }));

        const visitEvents = siteVisits
            .filter(sv => sv.status === 'Scheduled') // Assuming designers see all scheduled visits
            .map(sv => ({ date: new Date(sv.scheduledAt), title: 'Site Visit', type: 'visit' as const }));
            
        const leaveEvents: { date: Date, title: string, type: 'leave' }[] = [];
        leaveRequests
            .filter(l => l.designerId === user.id && l.status === 'Approved')
            .forEach(l => {
                let day = new Date(l.startDate);
                const end = new Date(l.endDate);
                while (day <= end) {
                    leaveEvents.push({ date: new Date(day), title: 'On Leave', type: 'leave' });
                    day.setDate(day.getDate() + 1);
                }
            });

        return [...taskEvents, ...visitEvents, ...leaveEvents];
    }, [user, tasks, siteVisits, leaveRequests, status]);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const calendarDays = [];
    for (let i = 0; i < startingDay; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-border-color"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const thisDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayEvents = events.filter(e => new Date(e.date).toDateString() === thisDate.toDateString());
        const isToday = thisDate.toDateString() === new Date().toDateString();

        calendarDays.push(
            <div key={day} className="border-r border-b border-border-color p-2 min-h-[120px] flex flex-col">
                <div className={`font-semibold ${isToday ? 'bg-brand-blue text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-text-headline'}`}>
                    {day}
                </div>
                <div className="mt-1 space-y-1 overflow-y-auto text-xs">
                    {dayEvents.map((event, index) => (
                         <div key={index} className={`p-1 rounded ${
                             event.type === 'task' ? 'bg-blue-500/20 text-blue-300' :
                             event.type === 'visit' ? 'bg-purple-500/20 text-purple-300' :
                             'bg-yellow-500/20 text-yellow-300'
                         }`}>
                             {event.title}
                         </div>
                    ))}
                </div>
            </div>
        );
    }

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">My Calendar</h1>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-surface"><ChevronDownIcon className="w-6 h-6 transform rotate-90" /></button>
                    <h2 className="text-xl font-bold text-text-headline">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-surface"><ChevronDownIcon className="w-6 h-6 transform -rotate-90" /></button>
                </div>
                <div className="grid grid-cols-7 border-t border-l border-border-color bg-primary-bg rounded-lg overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center font-bold text-text-muted p-2 border-r border-b border-border-color bg-surface">{day}</div>
                    ))}
                    {calendarDays}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500/50"></div> Task Deadline</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500/50"></div> Site Visit</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500/50"></div> On Leave</div>
                </div>
            </Card>
        </div>
    );
};

export default MyCalendar;
