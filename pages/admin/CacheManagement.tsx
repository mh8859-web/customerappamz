import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { TrashIcon, AlertTriangleIcon } from '../../components/icons';

const CacheManagement: React.FC = () => {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleClearCache = () => {
    // Clear all local and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Hard reload the page from the server
    window.location.reload();
  };

  return (
    <>
      <Modal 
        isOpen={isConfirmModalOpen} 
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Cache Deletion"
      >
        <div className="text-center">
            <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-text-secondary mb-6">Are you sure you want to clear all application cache? This will log you out and clear all stored data on your browser.</p>
            <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
                <Button onClick={handleClearCache} className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500">
                    Yes, Clear Cache
                </Button>
            </div>
        </div>
      </Modal>

      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-display text-text-primary">Cache Management</h1>
        
        <Card>
          <div className="flex flex-col items-center text-center p-8">
            <TrashIcon className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-text-primary">Clear Application Cache</h2>
            <p className="text-text-secondary mt-2 max-w-md">
              If you are experiencing issues with outdated data, clearing the cache can help resolve them. This action will remove all locally stored data and log you out.
            </p>
            <Button 
              onClick={() => setConfirmModalOpen(true)} 
              className="mt-6 !bg-red-600 hover:!bg-red-700 focus:ring-red-500"
            >
              Clear Cache Now
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default CacheManagement;
