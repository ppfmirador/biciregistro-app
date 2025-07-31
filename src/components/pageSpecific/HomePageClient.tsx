"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchBikeForm from "@/components/SearchBikeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, LockKeyhole, Users, User, Loader2 } from "lucide-react";
import Image from "next/image";
import SponsorCarousel from "@/components/SponsorCarousel";
import type { HomepageContent } from "@/lib/types";
import { getHomepageContent } from "@/lib/homepageContent";
import { Skeleton } from "../ui/skeleton";

interface HomePageClientProps {
  initialContent: HomepageContent;
}

export default function HomePageClient({
  initialContent,
}: HomePageClientProps) {
  const [content, setContent] = useState<HomepageContent>(initialContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const fetchedContent = await getHomepageContent();
        if (fetchedContent) {
          setContent(fetchedContent);
        }
      } catch (error) {
        console.error("Failed to fetch homepage content on client:", error);
        // Fallback to initialContent is already handled by the useState initializer
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="space-y-10 sm:space-y-12">
      <section className="text-center py-8 sm:py-12 bg-gradient-to-br from-primary to-accent rounded-lg shadow-xl">
        <div className="container mx-auto px-4">
          <ShieldCheck className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-white mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-primary-foreground mb-3 sm:mb-4">
            {isLoading ? (
              <Skeleton className="h-12 w-3/4 mx-auto" />
            ) : (
              content.welcomeTitle.replace("{APP_NAME}", "BiciRegistro")
            )}
          </h1>
          <div className="text-md sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-xl sm:max-w-2xl mx-auto">
            {isLoading ? (
              <Skeleton className="h-6 w-full mx-auto" />
            ) : (
              <p>{content.welcomeDescription}</p>
            )}
          </div>
          <div className="max-w-md sm:max-w-lg mx-auto mb-8">
            <SearchBikeForm />
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-primary-foreground/80">
              Verifica rápidamente si una bicicleta está reportada como robada.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <SponsorCarousel sponsors={content.sponsors || []} />
        )}
      </section>

      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-headline font-semibold text-center mb-8 sm:mb-10">
            {isLoading ? (
              <Skeleton className="h-10 w-1/2 mx-auto" />
            ) : (
              content.whyAppNameTitle.replace("{APP_NAME}", "BiciRegistro")
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">
                  {isLoading ? (
                    <Skeleton className="h-7 w-32 mx-auto" />
                  ) : (
                    content.feature1Title
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm sm:text-base text-center">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ) : (
                  <p>{content.feature1Description}</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <LockKeyhole className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">
                  {isLoading ? (
                    <Skeleton className="h-7 w-32 mx-auto" />
                  ) : (
                    content.feature2Title
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm sm:text-base text-center">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ) : (
                  <p>{content.feature2Description}</p>
                )}
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/10 text-primary mb-3 sm:mb-4">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <CardTitle className="font-headline text-lg sm:text-xl">
                  {isLoading ? (
                    <Skeleton className="h-7 w-32 mx-auto" />
                  ) : (
                    content.feature3Title
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm sm:text-base text-center">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                  </div>
                ) : (
                  <p>{content.feature3Description}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="md:w-1/2">
            {isLoading ? (
              <Skeleton className="rounded-lg shadow-md w-full h-auto aspect-video" />
            ) : (
              <Image
                src={content.communityImageUrl}
                alt="Comunidad ciclista unida y segura gracias a BiciRegistro"
                width={600}
                height={400}
                className="rounded-lg shadow-md w-full h-auto"
                data-ai-hint="cycling community happy"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://placehold.co/600x400.png";
                }}
              />
            )}
          </div>
          <div className="md:w-1/2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-headline font-semibold mb-3 sm:mb-4">
              {isLoading ? (
                <Skeleton className="h-10 w-3/4" />
              ) : (
                content.communityTitle
              )}
            </h2>
            <div className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                <p>
                  {content.communityDescription.replace(
                    "{APP_NAME}",
                    "BiciRegistro",
                  )}
                </p>
              )}
            </div>
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
