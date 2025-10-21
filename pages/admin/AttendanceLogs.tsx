import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import { AttendanceLog, WorkLog } from '../../types';
import { MapPinIcon } from '../../components/icons';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';

const AttendanceLogs: React.FC = () => {
  const { findUserById, attendanceLogs, workLogs, projects, status } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<WorkLog[]>([]);
  const [selectedDesigner, setSelectedDesigner] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const handleViewLogClick = (log: AttendanceLog) => {
    const designer = findUserById(log.designerId);
    const logDate = formatDate(log.clockIn);
    const designerWorkLogs = workLogs.filter(wl => wl.designerId === log.designerId && wl.date === logDate);
    
    setSelectedLogs(designerWorkLogs);
    setSelectedDesigner(designer?.fullName || 'Unknown');
    setSelectedDate(new Date(log.clockIn).toLocaleDateString());
    setModalOpen(true);
  };

  if (status !== 'authenticated') {
    return <div>Loading logs...</div>
  }

  return (
    <>
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title={`Work Log for ${selectedDesigner}`}
      >
        <p className="text-text-muted mb-4">Showing entries for {selectedDate}</p>
        {selectedLogs.length > 0 ? (
          <div className="space-y-4">
            {selectedLogs.map(log => {
              const project = projects.find(p => p.id === log.projectId);
              return (
                <div key={log.id} className="bg-primary-bg p-4 rounded-xl border border-border-color">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-text-headline">{project?.title}</p>
                    <span className="text-sm font-semibold text-brand-blue">{log.hoursSpent} hrs</span>
                  </div>
                  <p className="text-sm text-text-muted">{log.tasksCompleted}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-text-muted text-center py-4">No work log entries found for this date.</p>
        )}
      </Modal>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-headline">Designer Attendance Logs</h1>
        
        <Card>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {attendanceLogs.map((log: AttendanceLog) => {
              const designer = findUserById(log.designerId);
              return (
                <div key={log.id} className="bg-primary-bg p-4 rounded-xl text-sm">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-text-headline">{designer?.fullName}</p>
                    <span className="font-mono text-brand-blue">{log.duration}</span>
                  </div>
                  <div className="text-text-muted mt-2 space-y-1">
                    <p><strong className="text-text-headline/80">In:</strong> {new Date(log.clockIn).toLocaleString()}</p>
                    <p><strong className="text-text-headline/80">Out:</strong> {log.clockOut ? new Date(log.clockOut).toLocaleString() : 'N/A'}</p>
                     <p className="flex items-center gap-1 pt-1"><MapPinIcon className="w-4 h-4"/>{log.location}</p>
                  </div>
                  <Button variant="secondary" className="w-full mt-3 py-1 text-xs" onClick={() => handleViewLogClick(log)}>
                    View Work Log
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-text-muted uppercase bg-primary-bg">
                <tr>
                  <th scope="col" className="px-6 py-3">Designer</th>
                  <th scope="col" className="px-6 py-3">Clock In</th>
                  <th scope="col" className="px-6 py-3">Clock Out</th>
                  <th scope="col" className="px-6 py-3">Duration</th>
                  <th scope="col" className="px-6 py-3">Work Log</th>
                  <th scope="col" className="px-6 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs.map((log: AttendanceLog) => {
                  const designer = findUserById(log.designerId);
                  return (
                    <tr key={log.id} className="border-b border-border-color">
                      <td className="px-6 py-4 font-medium text-text-headline">{designer?.fullName}</td>
                      <td className="px-6 py-4 text-green-400">{new Date(log.clockIn).toLocaleString()}</td>
                      <td className="px-6 py-4 text-red-400">{log.clockOut ? new Date(log.clockOut).toLocaleString() : 'N/A'}</td>
                      <td className="px-6 py-4">{log.duration}</td>
                      <td className="px-6 py-4">
                        <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => handleViewLogClick(log)}>
                          View Work Log
                        </Button>
                      </td>
                      <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-xs text-text-muted">
                              <MapPinIcon className="w-4 h-4"/>
                              {log.location}
                          </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AttendanceLogs;
