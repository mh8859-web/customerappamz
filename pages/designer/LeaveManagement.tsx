
import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { MOCK_LEAVE_REQUESTS } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';

const LeaveManagement: React.FC = () => {
    const { user } = useAuth();
    const myLeaveRequests = MOCK_LEAVE_REQUESTS.filter(req => req.designerId === user?.id);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-headline">Leave Management</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Request Leave</h2>
                    <form className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-text-headline">Reason</label>
                            {/* FIX: Standardized focus ring color for UI consistency */}
                            <input type="text" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-headline">Start Date</label>
                            {/* FIX: Standardized focus ring color for UI consistency */}
                            <input type="date" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-text-headline">End Date</label>
                            {/* FIX: Standardized focus ring color for UI consistency */}
                            <input type="date" className="w-full mt-1 bg-primary-bg border border-border-color rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                        <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-text-headline mb-4">Your Requests</h2>
                    
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                        {myLeaveRequests.map(req => (
                             <div key={req.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-text-headline">{req.reason}</p>
                                     <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        req.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                        req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-text-muted">{req.startDate} to {req.endDate}</p>
                             </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                                <tr>
                                    <th className="px-6 py-3">Reason</th>
                                    <th className="px-6 py-3">Dates</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myLeaveRequests.map(req => (
                                    <tr key={req.id} className="border-b border-border-color">
                                        <td className="px-6 py-4 font-medium text-text-headline">{req.reason}</td>
                                        <td className="px-6 py-4">{req.startDate} to {req.endDate}</td>
                                        <td className="px-6 py-4">
                                             <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                req.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                                                req.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default LeaveManagement;