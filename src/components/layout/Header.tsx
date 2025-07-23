
"use client";

import Link from 'next/link';
import { LogOut, Settings, User, Store, LayoutDashboard, ShieldCheck, HeartHandshake, UserPlus, LogIn, CalendarDays } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';

const Header = () => {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted
    setIsClient(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if (user.isAdmin) return '/admin';
    if (user.role === 'bikeshop') return '/bikeshop/dashboard';
    if (user.role === 'ngo') return '/ngo/dashboard';
    return '/dashboard';
  };

  const renderAuthContent = () => {
    // On the server, or on the initial client render before the effect runs,
    // isClient will be false. We render a consistent placeholder to avoid mismatch.
    if (!isClient || loading) {
      return <div className="h-9 w-52 bg-muted rounded-md animate-pulse"></div>;
    }

    if (user && !user.isAnonymous) {
      return (
        <>
          <Link href={getDashboardLink()} className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1 flex items-center">
            <LayoutDashboard className="mr-1 h-4 w-4" /> 
            Panel
          </Link>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-xs sm:text-sm">
            <LogOut className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
           {user.isAdmin && ( 
             <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1">
                <Settings className="inline-block mr-1 h-4 w-4" /> Admin
            </Link>
           )}
        </>
      );
    }

    return (
      <>
        <Link href="/auth?mode=signup" passHref>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <UserPlus className="mr-1 h-4 w-4" />
            Crear Cuenta
          </Button>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="text-xs sm:text-sm">
              <LogIn className="mr-1 h-4 w-4" />
              Iniciar Sesión
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/auth?mode=login" data-testid="login-cyclist" className="w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Ciclista</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bikeshop/auth" data-testid="login-bikeshop" className="w-full cursor-pointer">
                <Store className="mr-2 h-4 w-4" />
                <span>Tienda</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/ngo/auth" data-testid="login-ngo" className="w-full cursor-pointer">
                <HeartHandshake className="mr-2 h-4 w-4" />
                <span>ONG</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-xl sm:text-2xl font-headline font-semibold">BiciRegistro</h1>
        </Link>
        <nav className="flex flex-wrap justify-center sm:justify-end items-center gap-1 sm:gap-2">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1">
            Inicio
          </Link>
           <Link href="/rides" className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1 flex items-center">
            <CalendarDays className="mr-1 h-4 w-4" />
            Eventos
          </Link>
          {renderAuthContent()}
        </nav>
      </div>
    </header>
  );
};

export default Header;
