"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Footer = () => {
  const [currentYear, setCurrentYear] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="bg-card shadow-md py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        {/* Changed <p> to <div> to prevent nesting block-level elements */}
        <div className="inline-block">
          <span>&copy; </span>
          {currentYear ? (
            <span className="font-semibold">{currentYear}</span>
          ) : (
            <Skeleton className="h-4 w-10 inline-block" />
          )}
          <span> BiciRegistro. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
