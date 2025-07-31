"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getShopRegisteredBikes } from "@/lib/db";
import type { Bike } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  Bike as BikeIcon,
  PlusCircle,
  Search as SearchIcon,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BikeStatusBadge from "@/components/bike/BikeStatusBadge";

interface ShopBikeListItemProps {
  bike: Bike;
}

const ShopBikeListItem: React.FC<ShopBikeListItemProps> = ({ bike }) => {
  return (
    <Card className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex-grow space-y-1">
        <h3 className="font-semibold text-base sm:text-lg">
          {bike.brand} {bike.model}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          N/S: {bike.serialNumber}
        </p>
        <p className="text-xs sm:text-sm">
          Propietario: {bike.ownerFirstName || ""} {bike.ownerLastName || ""}
          {bike.ownerEmail && (
            <span className="text-muted-foreground text-xs">
              {" "}
              ({bike.ownerEmail})
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col items-start sm:items-end sm:flex-row sm:items-center gap-2 sm:gap-3 flex-shrink-0">
        <BikeStatusBadge status={bike.status} className="px-2 py-0.5 text-xs" />
        <Link href={`/bike/${encodeURIComponent(bike.serialNumber)}`} passHref>
          <Button
            variant="outline"
            size="sm"
            className="text-xs sm:text-sm w-full sm:w-auto"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Ver Detalles
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default function BikeShopInventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchShopBikes = useCallback(
    async (currentSearchTerm: string) => {
      if (user && user.role === "bikeshop") {
        setIsLoading(true);
        try {
          const limitForFetch = currentSearchTerm ? undefined : 10;
          const shopBikes = await getShopRegisteredBikes(
            user.uid,
            currentSearchTerm || undefined,
            limitForFetch,
          );
          setBikes(shopBikes);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las bicicletas registradas.";
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("Error fetching shop-registered bikes:", error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [user, toast],
  );

  // Effect for initial data load and auth checks
  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "bikeshop") {
        toast({
          title: "Acceso Denegado",
          description: "Debes ser una tienda para ver esta página.",
          variant: "destructive",
        });
        router.push("/bikeshop/auth");
      } else {
        fetchShopBikes(""); // Fetch initial 10 bikes
      }
    }
  }, [user, authLoading, router, toast, fetchShopBikes]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    fetchShopBikes(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchShopBikes("");
  };

  if (authLoading || (isLoading && bikes.length === 0 && !searchTerm)) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando bicicletas registradas...</p>
      </div>
    );
  }

  if (!user || user.role !== "bikeshop") {
    return <p>Redirigiendo...</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold flex items-center">
            <BikeIcon className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            Bicicletas Registradas por {user.shopName || user.email}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualiza y busca las bicicletas que tu tienda ha registrado en
            BiciRegistro.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/bikeshop/dashboard")}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Buscar Bicicletas
          </CardTitle>
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2"
          >
            <Input
              type="text"
              placeholder="Buscar por N/S, nombre o email del propietario..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full sm:max-w-xs md:max-w-md"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="submit"
                variant="outline"
                disabled={isLoading}
                className="w-1/2 sm:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="mr-2 h-4 w-4" />
                )}
                Buscar
              </Button>
              {searchTerm && (
                <Button
                  variant="ghost"
                  onClick={handleClearSearch}
                  disabled={isLoading}
                  className="w-1/2 sm:w-auto"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </form>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary inline-block mr-2" />
              <span className="text-muted-foreground">Buscando...</span>
            </div>
          )}
          {!isLoading && bikes.length === 0 && searchTerm ? (
            <div className="text-center py-10">
              <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                No se encontraron bicicletas con el término &quot;{searchTerm}
                &quot;.
              </p>
            </div>
          ) : !isLoading && bikes.length === 0 && !searchTerm ? (
            <div className="text-center py-10">
              <BikeIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle className="text-xl sm:text-2xl">
                Aún No Has Registrado Bicis
              </CardTitle>
              <CardDescription className="mb-6 text-sm sm:text-base">
                Cuando registres bicicletas vendidas a tus clientes, aparecerán
                aquí.
              </CardDescription>
              <Link href="/bikeshop/register-sold-bike" passHref>
                <Button size="lg">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Registrar Bici Vendida
                </Button>
              </Link>
            </div>
          ) : (
            !isLoading &&
            bikes.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {bikes.map((bike) => (
                  <ShopBikeListItem key={bike.id} bike={bike} />
                ))}
                {!searchTerm && bikes.length === 10 && (
                  <p className="text-center text-sm text-muted-foreground pt-4">
                    Mostrando las últimas 10 bicicletas. Usa la búsqueda para
                    encontrar más.
                  </p>
                )}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
