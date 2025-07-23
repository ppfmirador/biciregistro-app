
"use client";

import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react'; 
import { ShieldCheck, Loader2 } from 'lucide-react'; 

function AuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const getInitialTab = () => searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    const modeFromParams = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
    if (modeFromParams !== activeTab) {
      setActiveTab(modeFromParams);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/auth?mode=${value}`, { scroll: false });
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8 sm:py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-headline">BiciRegistro</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {activeTab === 'login' ? '¡Bienvenido de nuevo! Inicia sesión para administrar tus bicicletas.' : 'Crea una cuenta para proteger tu rodada.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <AuthForm mode="login" />
            </TabsContent>
            <TabsContent value="signup">
              <AuthForm mode="signup" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando...</p>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
