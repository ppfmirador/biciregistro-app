
"use client";

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-card shadow-md py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>
            &copy; {currentYear ? currentYear : <Skeleton className="h-4 w-10 inline-block" />} BiciRegistro. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
