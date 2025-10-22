import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

const AboutPage: React.FC = () => {
  const [isDevModalOpen, setDevModalOpen] = useState(false);

  return (
    <>
      <Modal
        isOpen={isDevModalOpen}
        onClose={() => setDevModalOpen(false)}
        title="A Note From The Developer"
      >
        <div className="text-center">
          <p className="text-text-secondary italic">
            "Amaz App was created With Love And Dedication, this app provides you real time updates and with utmost care we will design your dream home your happiness is our moto"
          </p>
          <p className="font-semibold text-text-primary mt-4">-Yusuf</p>
        </div>
      </Modal>

      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold font-display text-text-primary text-center">About</h1>
        
        <Card>
          <div className="text-center p-8">
            <img 
              src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
              alt="AMAZ Interiors PM Logo" 
              className="h-16 mx-auto mb-6" 
            />
            <h2 className="text-2xl font-semibold font-display text-text-primary">
              AMAZ INTERIOR CP
            </h2>
            <p className="text-text-secondary mt-4">
              My amaz app for amaz members and clients.
            </p>
            <div className="border-t border-border-color my-6"></div>
            <p className="text-xs text-text-secondary">
              App Created With ❤️ By Amaz Team
            </p>
            <button 
              onClick={() => setDevModalOpen(true)}
              className="text-xs text-brand-blue hover:underline mt-2 cursor-pointer"
            >
              about developer
            </button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AboutPage;