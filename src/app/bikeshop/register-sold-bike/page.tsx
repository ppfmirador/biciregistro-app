
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, UserSearch, Bike as BikeIcon, Paperclip, PlusCircle, UserPlus, MailCheck } from 'lucide-react';
import { MEXICAN_STATES, BIKE_TYPES, GENDERS, PLACEHOLDER_NONE_VALUE, BIKE_STATUSES, LAT_AM_LOCATIONS, BIKE_BRANDS, OTHER_BRAND_VALUE } from '@/constants';
import type { UserProfile, BikeType } from '@/lib/types';
import { getUserProfileByEmail, createCustomerWithTemporaryPassword, addBikeToFirestore } from '@/lib/db';
import { uploadFileToStorage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { bikeShopRegisterSchema, type BikeShopRegisterFormValues } from '@/lib/schemas';

export default function RegisterSoldBikePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isVerifyingCustomer, setIsVerifyingCustomer] = useState(false);
  const [verifiedCustomer, setVerifiedCustomer] = useState<UserProfile | null>(null);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enteredCustomerEmail, setEnteredCustomerEmail] = useState('');
  const [showPostRegistrationMessage, setShowPostRegistrationMessage] = useState(false);


  const defaultFormValues: BikeShopRegisterFormValues = {
      customerEmail: '',
      customerFirstName: '',
      customerLastName: '',
      customerWhatsappPhone: '',
      customerCountry: '',
      customerProfileState: '',
      customerPostalCode: '',
      customerGender: '', // Valid: empty string is allowed by the enum
      serialNumber: '',
      brand: '',
      otherBrand: '',
      model: '',
      bikeType: '', // Valid: empty string is allowed by BikeType
      color: '',
      bikeState: '',
      description: '',
      photo1: undefined,
      photo2: undefined,
      photo3: undefined,
      ownershipDocument: undefined,
  };

  const { register, handleSubmit, control, watch, setValue, setError, clearErrors, reset, formState: { errors } } = useForm<BikeShopRegisterFormValues>({
    resolver: zodResolver(bikeShopRegisterSchema),
    defaultValues: defaultFormValues
  });

  const watchedCustomerEmail = watch('customerEmail');
  const watchedCustomerCountry = watch('customerCountry');
  const watchedBrand = watch('brand');

  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const photo3Ref = useRef<HTMLInputElement>(null);
  const ownershipDocumentRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'bikeshop') {
        toast({ title: "Acceso Denegado", description: "Debes ser una tienda para acceder.", variant: "destructive" });
        router.push('/bikeshop/auth');
      }
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    // When country changes, reset the state field
    setValue('customerProfileState', '');
  }, [watchedCustomerCountry, setValue]);


  const handleVerifyCustomerEmail = async () => {
    if (!watchedCustomerEmail) {
      setError('customerEmail', { type: 'manual', message: 'Ingresa un correo para verificar.' });
      return;
    }
    clearErrors('customerEmail');
    setIsVerifyingCustomer(true);
    setVerifiedCustomer(null);
    setCustomerNotFound(false);
    setShowPostRegistrationMessage(false);
    try {
      const foundUser = await getUserProfileByEmail(watchedCustomerEmail);
      if (foundUser) {
        setVerifiedCustomer(foundUser);
        setValue('customerFirstName', foundUser.firstName || '');
        setValue('customerLastName', foundUser.lastName || '');
        setValue('customerWhatsappPhone', foundUser.whatsappPhone || '');
        setValue('customerCountry', foundUser.country || '');
        setValue('customerProfileState', foundUser.profileState || '');
        setValue('customerPostalCode', foundUser.postalCode || '');
        setValue('customerGender', foundUser.gender || '');
        toast({ title: "Cliente Encontrado", description: `Cliente ${foundUser.email} verificado.` });
      } else {
        setCustomerNotFound(true);
        toast({ title: "Cliente No Encontrado", description: "Este cliente no tiene una cuenta. Ingresa sus datos manualmente para crear una pre-cuenta.", variant: "default" });
      }
    } catch (error: unknown) {
      toast({ title: "Error al Verificar", description: "No se pudo verificar el correo del cliente.", variant: "destructive" });
    } finally {
      setIsVerifyingCustomer(false);
      setEnteredCustomerEmail(watchedCustomerEmail);
    }
  };

  const onSubmit: SubmitHandler<BikeShopRegisterFormValues> = async (data) => {
    if (!user || user.role !== 'bikeshop') {
      toast({ title: "Error de Permisos", description: "No tienes permisos para esta acción.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    setShowPostRegistrationMessage(false);
    let customerUidToAssign: string | null = null;

    try {
      if (verifiedCustomer) {
        customerUidToAssign = verifiedCustomer.uid;
      } else if (customerNotFound) {
        if (!data.customerFirstName || !data.customerLastName) {
          setError('customerFirstName', { type: 'manual', message: 'Nombre es obligatorio.' });
          setError('customerLastName', { type: 'manual', message: 'Apellido es obligatorio.' });
          toast({ title: "Datos Faltantes", description: "Completa nombre y apellido del nuevo cliente.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        const newCustomerDetails = {
          firstName: data.customerFirstName,
          lastName: data.customerLastName,
          whatsappPhone: data.customerWhatsappPhone,
          country: data.customerCountry,
          profileState: data.customerProfileState,
          postalCode: data.customerPostalCode,
          gender: data.customerGender as BikeShopRegisterFormValues['customerGender'],
        };
        // createCustomerWithTemporaryPassword now also sends password reset email
        const { uid } = await createCustomerWithTemporaryPassword(data.customerEmail, newCustomerDetails, user.uid);
        customerUidToAssign = uid;
      } else {
        toast({ title: "Error", description: "Verifica o ingresa los datos del cliente.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      if (!customerUidToAssign) {
        toast({ title: "Error Crítico", description: "No se pudo determinar el UID del cliente.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const photoUrls: string[] = [];
      const bikeIdPlaceholder = uuidv4();

      const processUpload = async (fileList: FileList | undefined, type: 'photo' | 'document', index?: number) => {
        if (fileList && fileList.length > 0) {
          const file = fileList[0];
          let filePath = '';
          if (type === 'photo') {
            filePath = `bike_images/${customerUidToAssign}/${bikeIdPlaceholder}/photo_${index}_${Date.now()}_${file.name}`;
            const url = await uploadFileToStorage(file, filePath);
            photoUrls[index ? index-1 : 0] = url;
          } else {
            filePath = `bike_documents/${customerUidToAssign}/${bikeIdPlaceholder}/${Date.now()}_${file.name}`;
            return { url: await uploadFileToStorage(file, filePath), name: file.name };
          }
        }
        return null;
      };

      const photoUploadPromises = [data.photo1, data.photo2, data.photo3].map((fileList, i) => {
          if (fileList && fileList.length > 0) {
              return processUpload(fileList, 'photo', i + 1);
          }
          return Promise.resolve();
      });
      await Promise.all(photoUploadPromises);

      const ownershipDocResult = await processUpload(data.ownershipDocument, 'document');

      const finalBrand = data.brand === OTHER_BRAND_VALUE ? data.otherBrand || '' : data.brand;

      const bikeCoreData = {
        serialNumber: data.serialNumber,
        brand: finalBrand,
        model: data.model,
        color: data.color,
        description: data.description,
        state: data.bikeState,
        bikeType: data.bikeType,
        photoUrls: photoUrls.filter(url => url),
        ownershipDocumentUrl: ownershipDocResult?.url,
        ownershipDocumentName: ownershipDocResult?.name,
      };

      await addBikeToFirestore(
        bikeCoreData,
        customerUidToAssign,
        user.uid,
        BIKE_STATUSES[0],
        `Registrada por tienda: ${user.shopName || user.email}`,
      );

      toast({
        title: "¡Bicicleta Registrada!",
        description: `La bicicleta ${finalBrand} ${data.model} ha sido registrada para ${data.customerEmail}.`,
        duration: 7000,
      });

      if (customerNotFound) { // If a new pre-account was created
        setShowPostRegistrationMessage(true);
        setEnteredCustomerEmail(data.customerEmail); // Ensure this is set for the message
         toast({
          title: "Pre-Cuenta de Cliente Creada",
          description: `Se han enviado correos a ${data.customerEmail} para verificar su cuenta y establecer su contraseña.`,
          duration: 10000,
        });
      }

      reset(defaultFormValues);
      setVerifiedCustomer(null);
      setCustomerNotFound(false);
      // setEnteredCustomerEmail(''); // Keep for post registration message, then clear if navigating away
      if (photo1Ref.current) photo1Ref.current.value = "";
      if (photo2Ref.current) photo2Ref.current.value = "";
      if (photo3Ref.current) photo3Ref.current.value = "";
      if (ownershipDocumentRef.current) ownershipDocumentRef.current.value = "";

      // Optionally delay navigation or let user click away
      // router.push('/bikeshop/dashboard');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "No se pudo registrar la bicicleta.";
      console.error("Error registering bike by shop:", error);
      if (errorMessage.includes('Ya existe una bicicleta registrada con el número de serie:')) {
        setError('serialNumber', { type: 'manual', message: errorMessage });
        toast({ title: "Error: Número de Serie Duplicado", description: errorMessage, variant: "destructive", duration: 7000 });
      } else {
        toast({ title: "Error en el Registro", description: errorMessage, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push('/bikeshop/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel de Tienda
      </Button>

      <Card className="max-w-3xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-headline flex items-center">
            <PlusCircle className="mr-3 h-7 w-7 text-primary" />
            Registrar Bicicleta Vendida
          </CardTitle>
          <CardDescription>
            Ingresa el correo del cliente para verificar si tiene cuenta. Luego, completa los datos de la bicicleta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Customer Section */}
            <section className="space-y-4 p-4 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold flex items-center">
                <UserSearch className="mr-2 h-5 w-5 text-primary" />
                Datos del Cliente
              </h3>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Correo Electrónico del Cliente</Label>
                <div className="flex gap-2">
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register('customerEmail')}
                    placeholder="cliente@ejemplo.com"
                    className={errors.customerEmail ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                  />
                  <Button type="button" onClick={handleVerifyCustomerEmail} disabled={isVerifyingCustomer || !watchedCustomerEmail || isSubmitting}>
                    {isVerifyingCustomer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verificar
                  </Button>
                </div>
                {errors.customerEmail && <p className="text-sm text-destructive">{errors.customerEmail.message}</p>}
              </div>

              {verifiedCustomer && !customerNotFound && (
                <Card className="p-3 bg-green-50 border-green-200">
                  <p className="text-sm font-medium text-green-700">Cliente Verificado:</p>
                  <ul className="text-xs text-green-600 list-disc list-inside pl-1 space-y-0.5">
                    <li><span className="font-semibold">Nombre:</span> {verifiedCustomer.firstName} {verifiedCustomer.lastName}</li>
                    <li><span className="font-semibold">Email:</span> {verifiedCustomer.email}</li>
                    {verifiedCustomer.country && <li><span className="font-semibold">País:</span> {verifiedCustomer.country}</li>}
                    {verifiedCustomer.profileState && <li><span className="font-semibold">Estado:</span> {verifiedCustomer.profileState}</li>}
                    {verifiedCustomer.postalCode && <li><span className="font-semibold">C.P.:</span> {verifiedCustomer.postalCode}</li>}
                    {verifiedCustomer.whatsappPhone && <li><span className="font-semibold">Teléfono:</span> {verifiedCustomer.whatsappPhone}</li>}
                    {verifiedCustomer.gender && <li><span className="font-semibold">Género:</span> {GENDERS.find(g => g.value === verifiedCustomer.gender)?.label || verifiedCustomer.gender}</li>}
                  </ul>
                  <p className="text-xs text-green-700 mt-2">Los datos del cliente no son editables aquí. La bicicleta se asignará a este usuario.</p>
                </Card>
              )}

              {customerNotFound && (
                <div className="space-y-4 pt-3 border-t">
                  <p className="text-sm font-medium text-foreground">Ingresa los datos del nuevo cliente (se creará una pre-cuenta):</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="customerFirstName">Nombre(s) <span className="text-destructive">*</span></Label>
                      <Input id="customerFirstName" {...register('customerFirstName')} className={errors.customerFirstName ? 'border-destructive' : ''} disabled={isSubmitting} />
                      {errors.customerFirstName && <p className="text-xs text-destructive">{errors.customerFirstName.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customerLastName">Apellido(s) <span className="text-destructive">*</span></Label>
                      <Input id="customerLastName" {...register('customerLastName')} className={errors.customerLastName ? 'border-destructive' : ''} disabled={isSubmitting}/>
                      {errors.customerLastName && <p className="text-xs text-destructive">{errors.customerLastName.message}</p>}
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor="customerCountry">País de Residencia (Opcional)</Label>
                       <Controller
                          name="customerCountry"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)} value={field.value || ''} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                                {LAT_AM_LOCATIONS.map(c => <SelectItem key={c.country} value={c.country}>{c.country}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customerProfileState">Estado/Provincia (Opcional)</Label>
                       <Controller
                          name="customerProfileState"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)} value={field.value || ''} disabled={isSubmitting || !watchedCustomerCountry}>
                              <SelectTrigger><SelectValue placeholder={!watchedCustomerCountry ? "Selecciona un país primero" : "Selecciona un estado"} /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                                {LAT_AM_LOCATIONS.find(c => c.country === watchedCustomerCountry)?.states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="customerPostalCode">Código Postal (Opcional)</Label>
                        <Input id="customerPostalCode" {...register('customerPostalCode')} className={errors.customerPostalCode ? 'border-destructive' : ''} disabled={isSubmitting} placeholder="Ej. 12345" />
                        {errors.customerPostalCode && <p className="text-xs text-destructive">{errors.customerPostalCode.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="customerWhatsappPhone">Teléfono WhatsApp (Opcional)</Label>
                      <Input id="customerWhatsappPhone" {...register('customerWhatsappPhone')} className={errors.customerWhatsappPhone ? 'border-destructive' : ''} disabled={isSubmitting} />
                      {errors.customerWhatsappPhone && <p className="text-xs text-destructive">{errors.customerWhatsappPhone.message}</p>}
                    </div>
                     <div className="space-y-1">
                      <Label htmlFor="customerGender">Género (Opcional)</Label>
                       <Controller
                          name="customerGender"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value as BikeShopRegisterFormValues['customerGender'])} value={field.value || ''} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue placeholder="Selecciona un género" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                                {GENDERS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}
                        />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Bike Details Section */}
            <section className="space-y-4 p-4 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold flex items-center">
                <BikeIcon className="mr-2 h-5 w-5 text-primary" />
                Datos de la Bicicleta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="serialNumber">Número de Serie <span className="text-destructive">*</span></Label>
                  <Input id="serialNumber" {...register('serialNumber')} className={errors.serialNumber ? 'border-destructive' : ''} disabled={isSubmitting}/>
                  {errors.serialNumber && <p className="text-xs text-destructive">{errors.serialNumber.message}</p>}
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="brand">Marca <span className="text-destructive">*</span></Label>
                  <Controller
                    name="brand"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={isSubmitting}>
                        <SelectTrigger className={errors.brand ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecciona una marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {BIKE_BRANDS.sort().map(brandName => (
                            <SelectItem key={brandName} value={brandName}>{brandName}</SelectItem>
                          ))}
                          <SelectItem value={OTHER_BRAND_VALUE}>{OTHER_BRAND_VALUE} (especificar)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
                </div>
              </div>

              {watchedBrand === OTHER_BRAND_VALUE && (
                <div className="space-y-1 pt-2">
                    <Label htmlFor="otherBrand">Especifica la Marca <span className="text-destructive">*</span></Label>
                    <Input id="otherBrand" {...register('otherBrand')} className={errors.otherBrand ? 'border-destructive' : ''} disabled={isSubmitting} placeholder="Ej. Bicicletas Patito"/>
                    {errors.otherBrand && <p className="text-xs text-destructive">{errors.otherBrand.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="model">Modelo <span className="text-destructive">*</span></Label>
                  <Input id="model" {...register('model')} className={errors.model ? 'border-destructive' : ''} disabled={isSubmitting}/>
                  {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bikeType">Tipo de Bicicleta (Opcional)</Label>
                  <Controller
                    name="bikeType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value as BikeType)} value={field.value || ''} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                          {BIKE_TYPES.map(bt => <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="color">Color (Opcional)</Label>
                  <Input id="color" {...register('color')} disabled={isSubmitting} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bikeState">Estado (Ubicación Bici - Opcional)</Label>
                  <Controller
                    name="bikeState"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(value === PLACEHOLDER_NONE_VALUE ? '' : value)} value={field.value || ''} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={PLACEHOLDER_NONE_VALUE}>-- Ninguno --</SelectItem>
                          {MEXICAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Descripción Adicional (Opcional)</Label>
                <Textarea id="description" {...register('description')} placeholder="Detalles como componentes, accesorios, etc." disabled={isSubmitting}/>
              </div>

              <h4 className="text-md font-medium pt-3 border-t">Fotos de la Bicicleta (Opcional)</h4>
              {[1, 2, 3].map(i => (
                <div className="space-y-1" key={`photo-upload-${i}`}>
                  <Label htmlFor={`photo${i}`}>Foto ${i}</Label>
                  <Input id={`photo${i}`} type="file" accept="image/*" {...register(`photo${i}` as 'photo1')} className={(errors as any)[`photo${i}`] ? 'border-destructive' : ''} disabled={isSubmitting} ref={i === 1 ? photo1Ref : i === 2 ? photo2Ref : photo3Ref}/>
                  {(errors as any)[`photo${i}`] && <p className="text-xs text-destructive">{typeof (errors as any)[`photo${i}`].message === 'string' ? (errors as any)[`photo${i}`].message : 'Error de archivo'}</p>}
                </div>
              ))}

              <h4 className="text-md font-medium pt-3 border-t">Documento de Propiedad (Opcional)</h4>
              <div className="space-y-1">
                <Label htmlFor="ownershipDocument" className="flex items-center"><Paperclip className="h-4 w-4 mr-2" />Adjuntar Documento</Label>
                <Input id="ownershipDocument" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" {...register('ownershipDocument')} className={errors.ownershipDocument ? 'border-destructive' : ''} disabled={isSubmitting} ref={ownershipDocumentRef} />
                {errors.ownershipDocument && <p className="text-xs text-destructive">{typeof errors.ownershipDocument.message === 'string' ? errors.ownershipDocument.message : 'Error de archivo'}</p>}
              </div>
            </section>

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || isVerifyingCustomer || !enteredCustomerEmail || (!verifiedCustomer && !customerNotFound) }>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {(customerNotFound || (enteredCustomerEmail && !verifiedCustomer && !isVerifyingCustomer)) ? <UserPlus className="mr-2 h-4 w-4" /> : <BikeIcon className="mr-2 h-4 w-4" />}
              {customerNotFound ? 'Registrar Bici y Crear Cliente' : 'Registrar Bici para Cliente'}
            </Button>
            <p className="text-xs text-muted-foreground">
                {!enteredCustomerEmail ? "Por favor, ingresa y verifica el correo del cliente primero." :
                 (isVerifyingCustomer) ? "Verificando cliente..." :
                 (!verifiedCustomer && !customerNotFound) ? "Verifica el correo del cliente o ingresa sus datos manualmente si no se encuentra." : ""}
            </p>
            {showPostRegistrationMessage && customerNotFound && (
                <Card className="mt-4 p-4 bg-green-50 border-green-200">
                    <CardHeader className="p-0 pb-2">
                        <CardTitle className="text-md text-green-700 flex items-center">
                            <MailCheck className="mr-2 h-5 w-5" />
                            ¡Cliente Pre-Registrado!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <p className="text-sm text-green-600">
                            Se han enviado instrucciones a <strong className="font-semibold">{enteredCustomerEmail}</strong> para:
                        </p>
                        <ul className="list-disc list-inside text-xs text-green-600 mt-1 space-y-0.5">
                            <li>Verificar su dirección de correo electrónico.</li>
                            <li>Establecer su contraseña para acceder a Bike Guardian.</li>
                        </ul>
                        <p className="text-xs text-green-500 mt-2">
                            Por favor, informa al cliente que revise su bandeja de entrada (y spam).
                        </p>
                    </CardContent>
                </Card>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
