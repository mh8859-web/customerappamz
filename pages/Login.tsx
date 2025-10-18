import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-page-bg p-4">
      <main className="w-full max-w-md mx-auto text-center">
        <img 
          src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
          alt="AMAZ Interiors PM Logo" 
          className="h-16 mx-auto mb-6" 
        />
        <h1 className="text-3xl font-display font-semibold text-text-primary leading-tight">
          Not Available
        </h1>
        <p className="text-text-secondary mt-2">
          This application is currently not available. Please check back later.
        </p>
      </main>
    </div>
  );
};

export default Login;