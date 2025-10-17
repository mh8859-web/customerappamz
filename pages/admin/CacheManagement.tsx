import React from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { TrashIcon, AlertTriangleIcon } from '../../components/icons';

const CacheManagement: React.FC = () => {
  const handlePurgeCache = () => {
    if (window.confirm('Are you sure you want to purge all application cache? This will log you out and force a full reload. This action is irreversible.')) {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for (let registration of registrations) {
            registration.unregister();
          }
        }).catch(function(err) {
          console.error('Service Worker unregistration failed:', err);
        });
      }

      // 2. Clear all local and session storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Force a hard reload from the server
      // FIX: The `true` parameter for a hard reload is deprecated. The modern equivalent is to simply call `reload()` without arguments.
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display text-text-primary">Cache Management</h1>
      <Card>
        <div className="max-w-xl mx-auto text-center">
          <AlertTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Purge Application Cache</h2>
          <p className="text-text-secondary mb-6">
            If the application is not behaving as expected, you can perform a hard reset. This will clear all stored data, including your session, service workers, and any cached assets in your browser. You will be logged out and need to sign in again.
          </p>
          <Button
            onClick={handlePurgeCache}
            className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500 inline-flex items-center gap-2 !px-8 !py-3"
          >
            <TrashIcon className="w-5 h-5" />
            Purge All Cache & Reload
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CacheManagement;
