
"use client";

import { APP_NAME } from '@/constants';
import { useState, useEffect } from 'react';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<string>('');

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-card shadow-md py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        {/* Render the structure, but the year is empty on the server and initial client render */}
        <p>&copy; {currentYear} {APP_NAME}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
