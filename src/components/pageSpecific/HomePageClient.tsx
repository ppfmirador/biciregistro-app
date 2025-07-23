
"use client";

import Link from 'next/link';
import SearchBikeForm from '@/components/SearchBikeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, LockKeyhole, Users, User } from 'lucide-react';
import Image from 'next/image';
import SponsorCarousel from '@/components/SponsorCarousel';
import type { HomepageContent } from '@/lib/types';

// Fallback content in case initialContent is not properly passed (should be rare)
const fallbackContent: HomepageContent = {
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
  sponsors: [
    { id: 'def1', name: 'Sponsor Ejemplo 1', logoUrl: 'https://placehold.co/150x80.png', link: '#', dataAiHint: 'company logo' },
    { id: 'def2', name: 'Sponsor Ejemplo 2', logoUrl: 'https://placehold.co/150x80.png', link: '#', dataAiHint: 'brand mark' },
  ]
};

interface HomePageClientProps {
  initialContent: HomepageContent;
}

export default function HomePageClient({ initialContent }: HomePageClientProps) {
  const content = initialContent || fallbackContent;

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="text-center py-8 sm:py-12 bg-gradient-to-br from-primary to-accent rounded-lg shadow-xl">
        <div className="container mx-auto px-4">
          <ShieldCheck className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-white mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-primary-foreground mb-3 sm:mb-4">
            {content.welcomeTitle.replace('{APP_NAME}', 'BiciRegistro')}
          </h1>
          <p className="text-md sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto">
            {content.welcomeDescription}
          </p>
          <div className="max-w-md sm:max-w-lg mx-auto mb-8">
            <SearchBikeForm />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-primary-foreground/80">
              Verifica rápidamente si una bicicleta está reportada como robada.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <SponsorCarousel sponsors={content.sponsors || []} />
      </section>

      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-headline font-semibold text-center mb-8 sm:mb-10">
            {content.whyAppNameTitle.replace('{APP_NAME}', 'BiciRegistro')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">{content.feature1Title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base text-center">
                  {content.feature1Description}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <LockKeyhole className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">{content.feature2Title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base text-center">
                  {content.feature2Description}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">{content.feature3Title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm sm:text-base text-center">
                  {content.feature3Description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section className="py-8 sm:py-12 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="md:w-1/2">
            <Image 
              src={content.communityImageUrl || fallbackContent.communityImageUrl}
              alt="Comunidad ciclista unida y segura gracias a BiciRegistro"
              width={600}
              height={400}
              className="rounded-lg shadow-md w-full h-auto"
              data-ai-hint="cycling community happy"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; 
                target.src = fallbackContent.communityImageUrl; 
              }}
            />
          </div>
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-headline font-semibold mb-3 sm:mb-4">{content.communityTitle}</h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
              {content.communityDescription.replace('{APP_NAME}', 'BiciRegistro')}
            </p>
            <div className="flex justify-center md:justify-start">
              <Link href="/auth?mode=signup" passHref>
                <Button size="lg">
                  <User className="mr-2 h-5 w-5" />
                  Registra Tu Bici Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
