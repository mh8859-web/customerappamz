import React from 'react';
import Card from '../../components/ui/Card';

const AboutPage: React.FC = () => {
  return (
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
            A premium, luxury, mobile-responsive Interior Project Management web app that connects Admin, Designers, and Customers for seamless project tracking, design approvals, and communication.
          </p>
          <div className="border-t border-border-color my-6"></div>
          <h3 className="text-lg font-semibold text-text-primary">
            DEVELOPER YUSUF
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Application developed and maintained by Yusuf.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AboutPage;