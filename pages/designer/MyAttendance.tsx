import React from 'react';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { AttendanceLog } from '../../types';
import { MapPinIcon } from '../../components/icons';
import { useData } from '../../context/DataContext';

const MyAttendance: React.FC = () => {
    const { user } = useAuth();
    const { attendanceLogs, loading } = useData();
    if (!user || loading) return null;

    const myLogs = attendanceLogs
        .filter(log => log.designerId === user.id)
        .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">My Attendance History</h1>
            <Card>
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {myLogs.map((log: AttendanceLog) => (
                        <div key={log.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-text-headline">{new Date(log.clockIn).toLocaleDateString()}</p>
                                <span className="font-mono text-accent">{log.duration}</span>
                            </div>
                            <div className="text-text-muted mt-2 space-y-1">
                                <p><strong className="text-text-headline/80">In:</strong> {new Date(log.clockIn).toLocaleTimeString()}</p>
                                <p><strong className="text-text-headline/80">Out:</strong> {log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'N/A'}</p>
                                <p className="flex items-center gap-1 pt-1"><MapPinIcon className="w-4 h-4"/>{log.location}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Clock In</th>
                                <th scope="col" className="px-6 py-3">Clock Out</th>
                                <th scope="col" className="px-6 py-3">Duration</th>
                                <th scope="col" className="px-6 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myLogs.map((log: AttendanceLog) => (
                                <tr key={log.id} className="border-b border-border-color">
                                    <td className="px-6 py-4 font-medium text-text-headline">{new Date(log.clockIn).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-green-400">{new Date(log.clockIn).toLocaleTimeString()}</td>
                                    <td className="px-6 py-4 text-red-400">{log.clockOut ? new Date(log.clockOut).toLocaleTimeString() : 'N/A'}</td>
                                    <td className="px-6 py-4">{log.duration}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1 text-xs text-text-muted">
                                            <MapPinIcon className="w-4 h-4"/>
                                            {log.location}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default MyAttendance;
