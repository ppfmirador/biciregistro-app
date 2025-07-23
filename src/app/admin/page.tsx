
"use client";

import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, Save, PlusCircle, Trash2, LayoutGrid, Filter, Bike as BikeIcon, Users, AlertTriangle, ArrowRightLeft, BarChart, CalendarIcon, Store, UserCog, Edit, HeartHandshake, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getHomepageContent } from '@/lib/homepageContent';
import type { HomepageContent, SponsorConfig, UserProfileData, UserRole } from '@/lib/types';
import type { BikeShopAdminFormValues, NgoAdminFormValues } from '@/lib/schemas';
import { MEXICAN_STATES, BIKE_STATUSES } from '@/constants';
import NextImage from 'next/image';
import { uploadFileToStorage, deleteFileFromStorage, getPathFromStorageUrl } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getAllUsersForAdmin, createBikeShopAccountByAdmin, getAllBikeShops, updateUserDoc, createNgoAccountByAdmin, getAllNgos } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable, type FunctionsError, type HttpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BikeShopForm } from '@/components/admin/BikeShopForm';
import { NgoForm } from '@/components/admin/NgoForm';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContentCustom,
  AlertDialogDescription as AlertDialogDescriptionCustom,
  AlertDialogFooter as AlertDialogFooterCustom,
  AlertDialogHeader as AlertDialogHeaderCustom,
  AlertDialogTitle as AlertDialogTitleCustom,
} from "@/components/ui/alert-dialog";


const homepageTextContentSchema = z.object({
  welcomeTitle: z.string().min(1, 'El título de bienvenida es obligatorio.'),
  welcomeDescription: z.string().min(1, 'La descripción de bienvenida es obligatoria.'),
  whyAppNameTitle: z.string().min(1, 'El título de la sección "¿Por qué?" es obligatorio.'),
  feature1Title: z.string().min(1, 'El título de la Característica 1 es obligatorio.'),
  feature1Description: z.string().min(1, 'La descripción de la Característica 1 es obligatoria.'),
  feature2Title: z.string().min(1, 'El título de la Característica 2 es obligatorio.'),
  feature2Description: z.string().min(1, 'La descripción de la Característica 2 es obligatoria.'),
  feature3Title: z.string().min(1, 'El título de la Característica 3 es obligatorio.'),
  feature3Description: z.string().min(1, 'La descripción de la Característica 3 es obligatoria.'),
  communityTitle: z.string().min(1, 'El título de la sección de comunidad es obligatorio.'),
  communityDescription: z.string().min(1, 'La descripción de la sección de comunidad es obligatoria.'),
  referralMessage: z.string().optional(),
  ngoReferralMessageTemplate: z.string().max(500, 'La plantilla no debe exceder los 500 caracteres.').optional(),
});

type HomepageTextFormValues = z.infer<typeof homepageTextContentSchema>;

interface SponsorAdminItem extends SponsorConfig {
  logoFile?: File;
  newLogoPreview?: string;
  existingLogoPath?: string | null;
}

const defaultContentValues: HomepageContent = {
    welcomeTitle: `Bienvenido a BiciRegistro`,
    welcomeDescription: `Tu aliado de confianza en la seguridad de bicicletas. Registra tu bici, reporta robos y ayuda a construir una comunidad ciclista más segura.`,
    whyAppNameTitle: `¿Por qué BiciRegistro?`,
    feature1Title: "Registro Seguro",
    feature1Description: "Registra fácilmente tu bicicleta con su número de serie único, marca y modelo. Mantén la información de tu bici segura y accesible.",
    feature2Title: "Reporte de Robo",
    feature2Description: "En caso de robo, repórtalo rápidamente para alertar a la comunidad y a las autoridades. Aumenta las posibilidades de recuperación.",
    feature3Title: "Vigilancia Comunitaria",
    feature3Description:
      "Utiliza nuestra búsqueda pública para verificar el estado de una bicicleta antes de comprar una usada. Promueve la transparencia y disuade los robos.",
    communityTitle: "Únete a Nuestra Creciente Comunidad",
    communityDescription: `BiciRegistro es más que una base de datos; es una red de ciclistas comprometidos con la protección de sus bienes y el apoyo mutuo. Al registrar tu bici, contribuyes a un entorno más seguro para todos.`,
    communityImageUrl: "https://placehold.co/600x400.png",
    sponsors: [],
    referralMessage: `¡Hola! Te invito a unirte a BiciRegistro, una plataforma para registrar tu bicicleta y ayudar a la comunidad ciclista. ¡Es gratis! Regístrate aquí: [APP_LINK]`,
    ngoReferralMessageTemplate: `¡Hola! En {{ngoName}} sabemos lo importante que son nuestras bicis. Únete a BiciRegistro aquí: {{ngoLink}}`,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, isLoading }) => (
  <Card className="shadow-md hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
    </CardContent>
  </Card>
);

const ALL_STATUSES_VALUE = "_all_statuses_";
const ALL_LOCATIONS_VALUE = "_all_locations_";

interface AdminUser extends UserProfileData {
  id: string;
  bikeCount?: number;
}

type BikeShopWithId = UserProfileData & { id: string };
type NgoWithId = UserProfileData & { id: string };

interface UpdateUserRoleData { uid: string; role: UserRole; }
interface UpdateUserRoleResult { message: string; }
interface DeleteUserAccountData { uid: string; }
interface DeleteUserAccountResult { message: string; }

export default function AdminPage() {
  const { user, loading: authLoading, refreshUserProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAdminContent, setIsFetchingAdminContent] = useState(true);
  const { toast } = useToast();

  const [communityImageFile, setCommunityImageFile] = useState<File | undefined>();
  const [communityImagePreview, setCommunityImagePreview] = useState<string | undefined>(defaultContentValues.communityImageUrl);
  const [sponsors, setSponsors] = useState<SponsorAdminItem[]>([]);
  const [existingCommunityImageUrl, setExistingCommunityImageUrl] = useState<string | undefined>();

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  
  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [isNgoFormOpen, setIsNgoFormOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<BikeShopWithId | null>(null);
  const [editingNgo, setEditingNgo] = useState<NgoWithId | null>(null);
  const [bikeShops, setBikeShops] = useState<BikeShopWithId[]>([]);
  const [isFetchingShops, setIsFetchingShops] = useState(false);
  const [ngos, setNgos] = useState<NgoWithId[]>([]);
  const [isFetchingNgos, setIsFetchingNgos] = useState(false);

  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);


  const { register, handleSubmit, reset, formState: { errors } } = useForm<HomepageTextFormValues>({
    resolver: zodResolver(homepageTextContentSchema),
    defaultValues: { ...defaultContentValues }
  });
  
  const fetchAdminPageData = useCallback(async () => {
    setIsFetchingAdminContent(true);
    setIsFetchingUsers(true);
    setIsFetchingShops(true);
    setIsFetchingNgos(true);
    try {
      const [content, usersFromDb, shopsFromDb, ngosFromDb] = await Promise.all([
        getHomepageContent(),
        getAllUsersForAdmin(),
        getAllBikeShops(),
        getAllNgos(),
      ]);

      if (content) {
        reset({
            ...defaultContentValues, // Ensure all defaults are present
            ...content, // Override with fetched content
            referralMessage: content.referralMessage || defaultContentValues.referralMessage,
            ngoReferralMessageTemplate: content.ngoReferralMessageTemplate || defaultContentValues.ngoReferralMessageTemplate,
        });
        setCommunityImagePreview(content.communityImageUrl);
        setExistingCommunityImageUrl(content.communityImageUrl);
        setSponsors(content.sponsors.map(s => ({ ...s, existingLogoPath: getPathFromStorageUrl(s.logoUrl) })));
      } else {
        reset(defaultContentValues);
        setCommunityImagePreview(defaultContentValues.communityImageUrl);
        setSponsors(defaultContentValues.sponsors.map(s => ({ ...s, existingLogoPath: getPathFromStorageUrl(s.logoUrl) })));
      }

      setAllUsers(usersFromDb);
      setBikeShops(shopsFromDb);
      setNgos(ngosFromDb);

    } catch (error: unknown) {
      toast({ title: "Error", description: "No se pudo cargar el contenido/usuarios del administrador.", variant: "destructive" });
    } finally {
      setIsFetchingAdminContent(false);
      setIsFetchingUsers(false);
      setIsFetchingShops(false);
      setIsFetchingNgos(false);
    }
  }, [reset, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.isAdmin) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos para acceder a esta página.",
          variant: "destructive",
        });
        router.push('/');
        return;
      }
      fetchAdminPageData();
    }
  }, [user, authLoading, router, toast, fetchAdminPageData]);


  const handleCommunityImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCommunityImageFile(file);
      setCommunityImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSponsorChange = (index: number, field: keyof Omit<SponsorAdminItem, 'id' | 'existingLogoPath' | 'dataAiHint'>, value: string | File) => {
    const newSponsors = [...sponsors];
    if (field === 'logoFile' && value instanceof File) {
      if (newSponsors[index].newLogoPreview) {
        URL.revokeObjectURL(newSponsors[index].newLogoPreview as string);
      }
      newSponsors[index].logoFile = value;
      newSponsors[index].newLogoPreview = URL.createObjectURL(value);
    } else if (typeof value === 'string' && (field === 'name' || field === 'logoUrl' || field === 'link')) {
       newSponsors[index][field] = value;
    }
    setSponsors(newSponsors);
  };

  const handleSponsorDataAiHintChange = (index: number, value: string) => {
    const newSponsors = [...sponsors];
    newSponsors[index].dataAiHint = value;
    setSponsors(newSponsors);
  };

  const addSponsor = () => {
    setSponsors([...sponsors, { id: uuidv4(), name: '', logoUrl: '', link: '', dataAiHint: 'company logo' }]);
  };

  const removeSponsor = async (index: number) => {
    const sponsorToRemove = sponsors[index];
    if (sponsorToRemove && sponsorToRemove.newLogoPreview) {
      URL.revokeObjectURL(sponsorToRemove.newLogoPreview);
    }
    const newSponsors = sponsors.filter((_, i) => i !== index);
    setSponsors(newSponsors);
  };


  const onSubmitHomepageContent: SubmitHandler<HomepageTextFormValues> = async (data) => {
    setIsLoading(true);
    let finalCommunityImageUrl = existingCommunityImageUrl;
    const finalSponsors: SponsorConfig[] = [];

    try {
      const ngoTemplate = data.ngoReferralMessageTemplate || '';
      const placeholders = ngoTemplate.match(/\{\{\s*(\w+)\s*\}\}/g) || [];
      const allowedPlaceholders = ['ngoName', 'ngoLink'];
      for (const placeholder of placeholders) {
        const token = placeholder.replace(/[{}]/g, '').trim();
        if (!allowedPlaceholders.includes(token)) {
          toast({
            title: "Placeholder Inválido",
            description: `El placeholder "{{${token}}}" no es válido en la plantilla para ONGs. Permitidos: {{ngoName}}, {{ngoLink}}.`,
            variant: "destructive",
            duration: 9000,
          });
          setIsLoading(false);
          return;
        }
      }
      
      if (communityImageFile) {
        if (existingCommunityImageUrl) {
            const oldPath = getPathFromStorageUrl(existingCommunityImageUrl);
            if(oldPath) await deleteFileFromStorage(oldPath).catch(err => console.warn("Old community image deletion failed:", err));
        }
        const timestamp = Date.now();
        const extension = communityImageFile.name.split('.').pop();
        finalCommunityImageUrl = await uploadFileToStorage(communityImageFile, `homepage_assets/community_image_${timestamp}.${extension}`);
      }

      for (const sponsor of sponsors) {
        let currentLogoUrl = sponsor.logoUrl;
        if (sponsor.logoFile) {
          if (sponsor.existingLogoPath) {
             await deleteFileFromStorage(sponsor.existingLogoPath).catch(err => console.warn(`Sponsor logo deletion failed for ${sponsor.name}:`, err));
          }
          const logoTimestamp = Date.now();
          const logoExt = sponsor.logoFile.name.split('.').pop();
          const logoPath = `sponsors/${sponsor.id}_${logoTimestamp}.${logoExt}`;
          currentLogoUrl = await uploadFileToStorage(sponsor.logoFile, logoPath);
        }
        finalSponsors.push({
          id: sponsor.id,
          name: sponsor.name,
          logoUrl: currentLogoUrl,
          link: sponsor.link,
          dataAiHint: sponsor.dataAiHint || 'company logo',
        });
      }

      const initialSponsors = (await getHomepageContent())?.sponsors || [];
      for (const initialSponsor of initialSponsors) {
          if (!finalSponsors.find(fs => fs.id === initialSponsor.id)) {
              const oldLogoPath = getPathFromStorageUrl(initialSponsor.logoUrl);
              if (oldLogoPath) {
                  await deleteFileFromStorage(oldLogoPath).catch(err => console.warn(`Orphaned sponsor logo deletion failed for ${initialSponsor.name}:`, err));
              }
          }
      }

      const homepageDataToSave = {
        welcomeTitle: data.welcomeTitle,
        welcomeDescription: data.welcomeDescription,
        whyAppNameTitle: data.whyAppNameTitle,
        feature1Title: data.feature1Title,
        feature1Description: data.feature1Description,
        feature2Title: data.feature2Title,
        feature2Description: data.feature2Description,
        feature3Title: data.feature3Title,
        feature3Description: data.feature3Description,
        communityTitle: data.communityTitle,
        communityDescription: data.communityDescription,
        referralMessage: data.referralMessage || defaultContentValues.referralMessage,
        ngoReferralMessageTemplate: data.ngoReferralMessageTemplate || defaultContentValues.ngoReferralMessageTemplate,
        communityImageUrl: finalCommunityImageUrl || defaultContentValues.communityImageUrl,
        sponsors: finalSponsors,
      };

      const functionsInstance = getFunctions(app, 'us-central1');
      const updateContentCallable = httpsCallable(functionsInstance, 'updateHomepageContent');
      await updateContentCallable(homepageDataToSave);
      
      toast({ title: "¡Contenido Actualizado!", description: "El contenido de la página principal ha sido guardado." });
      setExistingCommunityImageUrl(finalCommunityImageUrl);
      setSponsors(finalSponsors.map(s => ({ ...s, existingLogoPath: getPathFromStorageUrl(s.logoUrl), newLogoPreview: undefined, logoFile: undefined })));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo guardar el contenido.";
      toast({ title: "Error al Guardar", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setIsDashboardLoading(true);
    toast({ title: "Funcionalidad en Desarrollo", description: "La carga de estadísticas con filtros aún no está implementada."});
    setTimeout(() => setIsDashboardLoading(false), 1000);
  };

  const handleUpdateRole = async (uid: string, role: UserRole) => {
    setIsLoading(true);
    try {
        const functionsInstance = getFunctions(app, 'us-central1');
        const updateUserRoleCallable: HttpsCallable<UpdateUserRoleData, UpdateUserRoleResult> = httpsCallable(functionsInstance, 'updateUserRole');
        
        const result = await updateUserRoleCallable({ uid, role });
        
        toast({ title: "Rol Actualizado", description: result.data.message });

        await fetchAdminPageData(); 
        if (user?.uid === uid) {
            await refreshUserProfile();
        }
    } catch (error: unknown) {
        const err = error as FunctionsError;
        const errorMessage = err.message || "Error desconocido al actualizar rol.";
        console.error("Error updating role:", error);
        toast({ title: "Error al Actualizar Rol", description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
};

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsLoading(true);
    try {
      const functionsInstance = getFunctions(app, 'us-central1');
      const deleteUserAccountCallable: HttpsCallable<DeleteUserAccountData, DeleteUserAccountResult> = httpsCallable(functionsInstance, 'deleteUserAccount');
      
      const result = await deleteUserAccountCallable({ uid: userToDelete.id });

      toast({ title: "Usuario Eliminado", description: result.data.message });
      await fetchAdminPageData();
    } catch (error: unknown) {
      const err = error as FunctionsError;
      const errorMessage = err.message || "No se pudo eliminar el usuario.";
      console.error("Error object from deleteUserAccount callable:", error);
      toast({ title: "Error al Eliminar Usuario", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };
  
  const handleOpenShopForm = (shop: BikeShopWithId | null) => {
    setEditingShop(shop);
    setIsShopFormOpen(true);
  };

  const handleOpenNgoForm = (ngo: NgoWithId | null) => {
    setEditingNgo(ngo);
    setIsNgoFormOpen(true);
  };
  
  const handleShopFormSubmit = async (data: BikeShopAdminFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (editingShop) {
        // Update existing shop
        await updateUserDoc(editingShop.id, data);
        toast({
          title: "Tienda Actualizada",
          description: `Los datos de ${data.shopName} han sido actualizados.`,
        });
      } else {
        // Create new shop
        await createBikeShopAccountByAdmin(data, user.uid);
        toast({
          title: "¡Cuenta de Tienda Creada!",
          description: `Se ha enviado un correo a ${data.email} con instrucciones para establecer la contraseña.`,
          duration: 9000,
        });
      }
      setIsShopFormOpen(false);
      setEditingShop(null);
      await fetchAdminPageData(); // Refresh the list of shops
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar tienda.";
      toast({ title: "Error al Guardar Tienda", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNgoFormSubmit = async (data: NgoAdminFormValues) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (editingNgo) {
        await updateUserDoc(editingNgo.id, data);
        toast({
          title: "ONG Actualizada",
          description: `Los datos de ${data.ngoName} han sido actualizados.`,
        });
      } else {
        await createNgoAccountByAdmin(data, user.uid);
        toast({
          title: "¡Cuenta de ONG Creada y Correo Enviado!",
          description: `Se ha enviado un correo a ${data.email} con instrucciones para establecer la contraseña.`,
          duration: 9000,
        });
      }
      setIsNgoFormOpen(false);
      setEditingNgo(null);
      await fetchAdminPageData(); // Refresh the list of NGOs
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al guardar ONG.";
      toast({ title: "Error al Guardar ONG", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!user && !isFetchingAdminContent)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl font-headline">Acceso de Administrador</CardTitle>
          </CardHeader>
          <CardContent>
            {authLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3">Verificando acceso...</p>
              </div>
            ) : (
              <p className="text-center text-destructive">
                No tienes permisos para ver esta página o no has iniciado sesión como administrador.
              </p>
            )}
            <Button onClick={() => router.push('/')} className="w-full mt-6">
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((isFetchingAdminContent || isFetchingUsers || isFetchingShops || isFetchingNgos) && !isDashboardLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Cargando datos del administrador...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-center">Panel de Administración</h1>
       <p className="text-center text-muted-foreground text-sm">
        Bienvenido, {user?.email}. Gestiona el contenido y la configuración de la aplicación.
      </p>

      <Tabs defaultValue="userManagement" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="userManagement">Usuarios</TabsTrigger>
          <TabsTrigger value="bikeshopManagement">Tiendas</TabsTrigger>
          <TabsTrigger value="ngoManagement">ONGs</TabsTrigger>
          <TabsTrigger value="contentManagement">Contenido</TabsTrigger>
          <TabsTrigger value="dashboard">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="contentManagement">
          <Card className="max-w-3xl mx-auto shadow-lg mt-6">
            <CardHeader>
              <CardTitle>Editar Contenido de la Página Principal</CardTitle>
              <CardDescription>Modifica los textos y las imágenes de la página principal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitHomepageContent)} className="space-y-6">

                <h2 className="text-xl font-semibold pt-4 border-t">Sección de Bienvenida</h2>
                <div className="space-y-2">
                  <Label htmlFor="welcomeTitle">Título de Bienvenida</Label>
                  <Input id="welcomeTitle" {...register('welcomeTitle')} className={errors.welcomeTitle ? 'border-destructive' : ''} />
                  {errors.welcomeTitle && <p className="text-sm text-destructive">{errors.welcomeTitle.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomeDescription">Descripción de Bienvenida</Label>
                  <Textarea id="welcomeDescription" {...register('welcomeDescription')} className={errors.welcomeDescription ? 'border-destructive' : ''} rows={3}/>
                  {errors.welcomeDescription && <p className="text-sm text-destructive">{errors.welcomeDescription.message}</p>}
                </div>

                <h2 className="text-xl font-semibold pt-4 border-t">Sección &quot;¿Por qué BiciRegistro?&quot;</h2>
                <div className="space-y-2">
                  <Label htmlFor="whyAppNameTitle">Título de la Sección</Label>
                  <Input id="whyAppNameTitle" {...register('whyAppNameTitle')} className={errors.whyAppNameTitle ? 'border-destructive' : ''} />
                  {errors.whyAppNameTitle && <p className="text-sm text-destructive">{errors.whyAppNameTitle.message}</p>}
                </div>
                <h3 className="text-lg font-medium">Característica 1 (Registro Seguro)</h3>
                <div className="space-y-2">
                  <Label htmlFor="feature1Title">Título Característica 1</Label>
                  <Input id="feature1Title" {...register('feature1Title')} className={errors.feature1Title ? 'border-destructive' : ''} />
                  {errors.feature1Title && <p className="text-sm text-destructive">{errors.feature1Title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature1Description">Descripción Característica 1</Label>
                  <Textarea id="feature1Description" {...register('feature1Description')} className={errors.feature1Description ? 'border-destructive' : ''} rows={3}/>
                  {errors.feature1Description && <p className="text-sm text-destructive">{errors.feature1Description.message}</p>}
                </div>

                <h3 className="text-lg font-medium pt-2">Característica 2 (Reporte de Robo)</h3>
                <div className="space-y-2">
                  <Label htmlFor="feature2Title">Título Característica 2</Label>
                  <Input id="feature2Title" {...register('feature2Title')} className={errors.feature2Title ? 'border-destructive' : ''} />
                  {errors.feature2Title && <p className="text-sm text-destructive">{errors.feature2Title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature2Description">Descripción Característica 2</Label>
                  <Textarea id="feature2Description" {...register('feature2Description')} className={errors.feature2Description ? 'border-destructive' : ''} rows={3}/>
                  {errors.feature2Description && <p className="text-sm text-destructive">{errors.feature2Description.message}</p>}
                </div>

                <h3 className="text-lg font-medium pt-2">Característica 3 (Vigilancia Comunitaria)</h3>
                <div className="space-y-2">
                  <Label htmlFor="feature3Title">Título Característica 3</Label>
                  <Input id="feature3Title" {...register('feature3Title')} className={errors.feature3Title ? 'border-destructive' : ''} />
                  {errors.feature3Title && <p className="text-sm text-destructive">{errors.feature3Title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feature3Description">Descripción Característica 3</Label>
                  <Textarea id="feature3Description" {...register('feature3Description')} className={errors.feature3Description ? 'border-destructive' : ''} rows={3}/>
                  {errors.feature3Description && <p className="text-sm text-destructive">{errors.feature3Description.message}</p>}
                </div>

                <h2 className="text-xl font-semibold pt-4 border-t">Sección &quot;Únete a Nuestra Comunidad&quot;</h2>
                <div className="space-y-2">
                  <Label htmlFor="communityTitle">Título de Comunidad</Label>
                  <Input id="communityTitle" {...register('communityTitle')} className={errors.communityTitle ? 'border-destructive' : ''} />
                  {errors.communityTitle && <p className="text-sm text-destructive">{errors.communityTitle.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="communityDescription">Descripción de Comunidad</Label>
                  <Textarea id="communityDescription" {...register('communityDescription')} className={errors.communityDescription ? 'border-destructive' : ''} rows={3}/>
                  {errors.communityDescription && <p className="text-sm text-destructive">{errors.communityDescription.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="communityImageUpload">Imagen de Comunidad</Label>
                    {communityImagePreview && (
                        <div className="my-2">
                            <NextImage src={communityImagePreview} alt="Vista previa de Comunidad" width={300} height={200} className="rounded-md object-cover" data-ai-hint="cycling group" />
                        </div>
                    )}
                    <Input id="communityImageUpload" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleCommunityImageChange} />
                    <p className="text-xs text-muted-foreground">Sube una nueva imagen para reemplazar la actual. JPG/PNG/WEBP, máx 1MB recomendado.</p>
                </div>

                <h2 className="text-xl font-semibold pt-4 border-t">Mensajes de Invitación por WhatsApp</h2>
                 <div className="space-y-2">
                  <Label htmlFor="referralMessage">Mensaje para Ciclistas</Label>
                  <Textarea
                    id="referralMessage"
                    {...register('referralMessage')}
                    rows={3}
                    placeholder="Ej: ¡Hola! Te invito a unirte a BiciRegistro. Registra tu bici aquí: [APP_LINK]"
                    className={errors.referralMessage ? 'border-destructive' : ''}
                  />
                  {errors.referralMessage && <p className="text-sm text-destructive">{errors.referralMessage.message}</p>}
                  <p className="text-xs text-muted-foreground">
                    Placeholder: <strong>[APP_LINK]</strong>
                  </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="ngoReferralMessageTemplate">Plantilla de Invitación para ONGs</Label>
                    <Textarea
                        id="ngoReferralMessageTemplate"
                        {...register('ngoReferralMessageTemplate')}
                        rows={4}
                        placeholder="Ej: ¡Hola! En {{ngoName}} te invitamos a unirte a la comunidad. Regístrate aquí: {{ngoLink}}"
                        className={errors.ngoReferralMessageTemplate ? 'border-destructive' : ''}
                    />
                    {errors.ngoReferralMessageTemplate && <p className="text-sm text-destructive">{errors.ngoReferralMessageTemplate.message}</p>}
                    <p className="text-xs text-muted-foreground">
                        Placeholders permitidos: <strong>{"{{ngoName}}"}</strong>, <strong>{"{{ngoLink}}"}</strong>.
                    </p>
                </div>


                <h2 className="text-xl font-semibold pt-4 border-t">Administrar Aliados</h2>
                {sponsors.map((sponsor, index) => (
                  <Card key={sponsor.id} className="p-4 space-y-3 my-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Aliado {index + 1}</h4>
                      <Button variant="ghost" size="icon" onClick={() => removeSponsor(index)} type="button" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sponsorName-${index}`}>Nombre del Aliado</Label>
                      <Input
                        id={`sponsorName-${index}`}
                        value={sponsor.name}
                        onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sponsorLink-${index}`}>Enlace (URL) del Aliado (Opcional)</Label>
                      <Input
                        id={`sponsorLink-${index}`}
                        type="url"
                        value={sponsor.link || ''}
                        onChange={(e) => handleSponsorChange(index, 'link', e.target.value)}
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`sponsorDataAiHint-${index}`}>Palabras clave para IA (logo)</Label>
                        <Input
                            id={`sponsorDataAiHint-${index}`}
                            value={sponsor.dataAiHint || ''}
                            onChange={(e) => handleSponsorDataAiHintChange(index, e.target.value)}
                            placeholder="ej. company logo"
                        />
                         <p className="text-xs text-muted-foreground">Max 2 palabras, para búsqueda de imágenes.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`sponsorLogo-${index}`}>Logo del Aliado</Label>
                        {(sponsor.newLogoPreview || sponsor.logoUrl) && (
                            <div className="my-2">
                                <NextImage src={sponsor.newLogoPreview || sponsor.logoUrl} alt={`Logo ${sponsor.name}`} width={150} height={80} className="rounded-md object-contain bg-muted p-1" data-ai-hint={sponsor.dataAiHint || "company logo"}/>
                            </div>
                        )}
                        <Input
                            id={`sponsorLogo-${index}`}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleSponsorChange(index, 'logoFile', e.target.files[0]);
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">PNG/JPG/WEBP, máx 200KB recomendado.</p>
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" onClick={addSponsor} className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar Aliado
                </Button>

                <Button type="submit" className="w-full sm:w-auto mt-6" disabled={isLoading || isFetchingAdminContent}>
                  {(isLoading || isFetchingAdminContent) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Contenido
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card className="max-w-5xl mx-auto shadow-lg mt-6">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <LayoutGrid className="mr-3 h-7 w-7 text-primary"/> Panel de Estadísticas
              </CardTitle>
              <CardDescription>Visualiza métricas clave y filtra datos del uso de la aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <Card className="p-4 sm:p-6">
                <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl flex items-center"><Filter className="mr-2 h-5 w-5"/> Filtros</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="dateRangeStart" className="text-sm">Rango de Fechas</Label>
                            <div className="flex gap-2 items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange.from && "text-muted-foreground"
                                        )}
                                        disabled={isDashboardLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? format(dateRange.from, "PPP", { locale: es }) : <span>Fecha Inicio</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(day) => setDateRange(prev => ({...prev, from: day}))}
                                        initialFocus
                                        disabled={isDashboardLoading}
                                    />
                                    </PopoverContent>
                                </Popover>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dateRange.to && "text-muted-foreground"
                                        )}
                                        disabled={isDashboardLoading}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.to ? format(dateRange.to, "PPP", { locale: es }) : <span>Fecha Fin</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(day) => setDateRange(prev => ({...prev, to: day}))}
                                        disabled={(date) => {
                                          if (isDashboardLoading) return true;
                                          if (dateRange.from && date < dateRange.from) return true; // Corrected logic
                                          return false;
                                        }}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Funcionalidad de filtrado por fecha próximamente.</p>
                        </div>
                        <div>
                            <Label htmlFor="statusFilter" className="text-sm">Por Estado de Bici</Label>
                            <Select
                                value={selectedStatus}
                                onValueChange={(value) => setSelectedStatus(value === ALL_STATUSES_VALUE ? '' : value)}
                                disabled={isDashboardLoading}
                            >
                            <SelectTrigger id="statusFilter"><SelectValue placeholder="Todos los Estados" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_STATUSES_VALUE}>Todos los Estados</SelectItem>
                                {BIKE_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                             <p className="text-xs text-muted-foreground mt-1">Funcionalidad de filtrado por estado próximamente.</p>
                        </div>
                        <div>
                            <Label htmlFor="locationFilter" className="text-sm">Por Ubicación (Estado)</Label>
                            <Select
                                value={selectedLocation}
                                onValueChange={(value) => setSelectedLocation(value === ALL_LOCATIONS_VALUE ? '' : value)}
                                disabled={isDashboardLoading}
                            >
                            <SelectTrigger id="locationFilter"><SelectValue placeholder="Todas las Ubicaciones" /></SelectTrigger>
                            <SelectContent>
                                 <SelectItem value={ALL_LOCATIONS_VALUE}>Todas las Ubicaciones</SelectItem>
                                {MEXICAN_STATES.map(state => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                             <p className="text-xs text-muted-foreground mt-1">Funcionalidad de filtrado por ubicación próximamente.</p>
                        </div>
                    </div>
                    <Button onClick={handleApplyFilters} disabled={isDashboardLoading} className="mt-4">
                        {isDashboardLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Aplicar Filtros (Próximamente)
                    </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard title="Bicicletas Registradas" value="N/A" icon={<BikeIcon className="h-7 w-7 text-primary"/>} description="Total de bicis en el sistema." isLoading={isDashboardLoading}/>
                <StatCard title="Usuarios Registrados" value="N/A" icon={<Users className="h-7 w-7 text-primary"/>} description="Total de cuentas de usuario." isLoading={isDashboardLoading}/>
                <StatCard title="Reportes de Robo Activos" value="N/A" icon={<AlertTriangle className="h-7 w-7 text-destructive"/>} description="Bicis actualmente marcadas como robadas." isLoading={isDashboardLoading}/>
                <StatCard title="Transferencias Completadas" value="N/A" icon={<ArrowRightLeft className="h-7 w-7 text-green-600"/>} description="Total de transferencias de propiedad exitosas." isLoading={isDashboardLoading}/>
              </div>

              <Card className="p-4 sm:p-6 text-center">
                <CardHeader className="p-0 pb-4">
                     <CardTitle className="text-xl flex items-center justify-center"><BarChart className="mr-2 h-6 w-6 text-primary"/> Gráficas de Uso</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Visualizaciones de datos próximamente.</p>
                    </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bikeshopManagement">
          <Card className="max-w-4xl mx-auto shadow-lg mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Store className="mr-3 h-6 w-6 text-primary"/> Gestionar Tiendas de Bicicletas
                  </CardTitle>
                  <CardDescription>Crea, edita y gestiona las cuentas de tiendas de bicicletas.</CardDescription>
                </div>
                <Button onClick={() => handleOpenShopForm(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Tienda
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <Separator />
                
                <h3 className="text-lg font-semibold">Tiendas Existentes</h3>
                {isFetchingShops ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : bikeShops.length > 0 ? (
                    <div className="space-y-3">
                        {bikeShops.map(shop => (
                            <Card key={shop.id} className="p-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{shop.shopName}</p>
                                        <p className="text-sm text-muted-foreground">{shop.email}</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleOpenShopForm(shop)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No hay tiendas registradas.</p>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ngoManagement">
            <Card className="max-w-4xl mx-auto shadow-lg mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center">
                                <HeartHandshake className="mr-3 h-6 w-6 text-primary" /> Gestionar ONGs y Colectivos
                            </CardTitle>
                            <CardDescription>Crea, edita y gestiona las cuentas de ONGs.</CardDescription>
                        </div>
                        <Button onClick={() => handleOpenNgoForm(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva ONG
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />
                    <h3 className="text-lg font-semibold">ONGs Existentes</h3>
                    {isFetchingNgos ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : ngos.length > 0 ? (
                        <div className="space-y-3">
                            {ngos.map(ngo => (
                                <Card key={ngo.id} className="p-3">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{ngo.ngoName}</p>
                                            <p className="text-sm text-muted-foreground">{ngo.email}</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleOpenNgoForm(ngo)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-4">No hay ONGs registradas.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="userManagement">
            <Card className="max-w-4xl mx-auto shadow-lg mt-6">
                <CardHeader>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>Administra los roles y el estado de todos los usuarios de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFetchingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">Cargando usuarios...</p>
                        </div>
                    ) : allUsers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No hay usuarios registrados en el sistema.</p>
                    ) : (
                        <div className="space-y-4">
                            {allUsers.map((userItem) => (
                                <Card key={userItem.id} className="p-3">
                                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold">{userItem.email}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {userItem.shopName || userItem.ngoName || `${userItem.firstName || ''} ${userItem.lastName || ''}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select value={userItem.role || 'cyclist'} onValueChange={(role) => handleUpdateRole(userItem.id, role as UserRole)} disabled={isLoading || userItem.id === user?.uid}>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Selecciona un rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cyclist"><Users className="inline-block mr-2 h-4 w-4"/>Ciclista</SelectItem>
                                                    <SelectItem value="bikeshop"><Store className="inline-block mr-2 h-4 w-4"/>Tienda</SelectItem>
                                                    <SelectItem value="ngo"><HeartHandshake className="inline-block mr-2 h-4 w-4"/>ONG</SelectItem>
                                                    <SelectItem value="admin"><UserCog className="inline-block mr-2 h-4 w-4"/>Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button variant="destructive" size="icon" onClick={() => { setUserToDelete(userItem); setIsDeleteConfirmOpen(true); }} disabled={isLoading || userItem.id === user?.uid}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
      
      {/* Dialog for Creating/Editing a Bike Shop */}
      <Dialog open={isShopFormOpen} onOpenChange={setIsShopFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingShop ? 'Editar Tienda de Bicicletas' : 'Añadir Nueva Tienda de Bicicletas'}</DialogTitle>
            <DialogDescription>
              {editingShop ? `Modifica los detalles de ${editingShop.shopName}.` : 'Completa el formulario para registrar una nueva tienda. Se creará una cuenta y se enviará un correo para establecer la contraseña.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
            <BikeShopForm
                onSubmit={handleShopFormSubmit}
                initialData={editingShop}
                isLoading={isLoading}
                isEditMode={!!editingShop}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for Creating/Editing an NGO */}
      <Dialog open={isNgoFormOpen} onOpenChange={setIsNgoFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingNgo ? 'Editar ONG' : 'Añadir Nueva ONG'}</DialogTitle>
            <DialogDescription>
              {editingNgo ? `Modifica los detalles de ${editingNgo.ngoName}.` : 'Completa el formulario para registrar una nueva ONG. Se creará una cuenta y se enviará un correo para establecer la contraseña.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto pr-4">
            <NgoForm
                onSubmit={handleNgoFormSubmit}
                initialData={editingNgo}
                isLoading={isLoading}
                isEditMode={!!editingNgo}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for User Deletion */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContentCustom>
          <AlertDialogHeaderCustom>
            <AlertDialogTitleCustom>¿Estás absolutamente seguro?</AlertDialogTitleCustom>
            <AlertDialogDescriptionCustom>
              Esta acción es irreversible. Se eliminará permanentemente la cuenta de <strong className="break-all">{userToDelete?.email}</strong> y todos sus datos asociados, incluidas las bicicletas que haya registrado.
              {userToDelete && typeof userToDelete.bikeCount === 'number' && userToDelete.bikeCount > 0 &&
                <span className="font-bold text-destructive block mt-2">
                    ¡Advertencia! Este usuario tiene {userToDelete.bikeCount} bicicleta(s) registrada(s) que también serán eliminadas.
                </span>
              }
            </AlertDialogDescriptionCustom>
          </AlertDialogHeaderCustom>
          <AlertDialogFooterCustom>
            <AlertDialogCancel disabled={isLoading} onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserX className="mr-2 h-4 w-4" />}
              Sí, eliminar usuario
            </AlertDialogAction>
          </AlertDialogFooterCustom>
        </AlertDialogContentCustom>
      </AlertDialog>
    </div>
  );
}
