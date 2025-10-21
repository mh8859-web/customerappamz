import React from 'react';
import Card from '../../components/ui/Card';
import { DownloadIcon, FileTextIcon } from '../../components/icons';
import { useData } from '../../context/DataContext';
import { useUsers } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const DownloadCenter: React.FC = () => {
  const { user } = useAuth();
  const { quotes, projects, loading } = useData();
  const { findUserById } = useUsers();

  if (loading || !user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold font-display text-text-primary">Download Center</h1>
        <Card>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded-xl"></div>
              <div className="h-16 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const userProjectIds = projects
    .filter(p => user.role === 'Admin' || p.designerId === user.id || p.customerId === user.id)
    .map(p => p.id);

  const availableQuotes = quotes.filter(q => userProjectIds.includes(q.projectId));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display text-text-primary">Download Center</h1>
      <Card>
        <h2 className="text-xl font-semibold font-display text-text-primary mb-4">Project Quotes</h2>
        {availableQuotes.length > 0 ? (
          <div className="space-y-3">
            {availableQuotes.map(q => {
              const project = projects.find(p => p.id === q.projectId);
              const uploader = findUserById(q.uploadedBy);
              return (
                <div key={q.id} className="bg-page-bg p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <FileTextIcon className="w-8 h-8 text-brand-blue flex-shrink-0"/>
                        <div>
                            <p className="font-semibold text-text-primary capitalize">{project?.title} - {q.version} Quote</p>
                            <p className="text-xs text-text-secondary">Uploaded by {uploader?.fullName} on {new Date(q.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <a href={q.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="!p-2">
                          <DownloadIcon className="w-5 h-5" />
                      </Button>
                    </a>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <DownloadIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary">No Downloads Available</h2>
            <p className="text-text-secondary mt-2">
              Project documents, invoices, and other files available for download will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DownloadCenter;