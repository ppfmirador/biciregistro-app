"use client";

import { AuthForm } from "@/components/auth/AuthForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Store, Loader2 } from "lucide-react";

function BikeShopAuthPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Default to login for bike shops, signup might be admin-controlled
  const getInitialTab = () =>
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    const modeFromParams =
      searchParams.get("mode") === "signup" ? "signup" : "login";
    if (modeFromParams !== activeTab) {
      setActiveTab(modeFromParams);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/bikeshop/auth?mode=${value}`, { scroll: false });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-8 sm:py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-3 sm:mb-4">
            <Store className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-headline">
            BiciRegistro - Portal Tiendas
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {activeTab === "login"
              ? "Inicia sesión para acceder al portal de tiendas."
              : "Registro para Tiendas (Próximamente desde Admin)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup" disabled>
                Registrarse (Admin)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              {/* Pass a prop to AuthForm if it needs to behave differently for bikeshops, e.g., redirect */}
              <AuthForm mode="login" userType="bikeshop" />
            </TabsContent>
            <TabsContent value="signup">
              <p className="text-center text-muted-foreground">
                El registro de tiendas se realiza a través del panel de
                administración.
              </p>
              {/* Optionally, could show a simplified signup form that defaults role to bikeshop if admin signup isn't ready */}
              {/* <AuthForm mode="signup" userType="bikeshop" /> */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BikeShopAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Cargando...</p>
        </div>
      }
    >
      <BikeShopAuthPageContent />
    </Suspense>
  );
}
