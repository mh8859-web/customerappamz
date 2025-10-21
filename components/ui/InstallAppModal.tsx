import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { DownloadIcon } from '../icons';

const InstallAppModal: React.FC<{ isOpen: boolean; onClose: () => void; onInstall: () => void; }> = ({ isOpen, onClose, onInstall }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Install AMAZ Interiors App">
      <div className="text-center">
        <img 
          src="https://res.cloudinary.com/dzvmyhpff/image/upload/w_192,h_192,c_pad/v1759808706/highqualiamaz_etnjtt.png" 
          alt="App Icon" 
          className="w-20 h-20 mx-auto mb-4 rounded-2xl"
        />
        <p className="text-text-secondary mb-6">
          For the best experience, install the AMAZ Interiors app to your home screen for quick and easy access.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="secondary" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={onInstall} className="flex items-center gap-2">
            <DownloadIcon className="w-5 h-5" /> Install App
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstallAppModal;
