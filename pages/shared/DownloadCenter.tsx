import React from 'react';
import Card from '../../components/ui/Card';
import { DownloadIcon } from '../../components/icons';

const DownloadCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display text-text-primary">Download Center</h1>
      <Card>
        <div className="text-center py-12">
          <DownloadIcon className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary">No Downloads Available</h2>
          <p className="text-text-secondary mt-2">
            Project documents, invoices, and other files available for download will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default DownloadCenter;