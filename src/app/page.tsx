
// No "use client" here
import type { Metadata } from "next";
import { getHomepageContentServer } from "@/lib/homepageContentServer"; // Corrected import
import type { HomepageContent } from "@/lib/types";
import { APP_NAME } from '@/constants';
import HomePageClient from "@/components/pageSpecific/HomePageClient";

// Default content, used as fallback or if Firestore data is unavailable
const defaultContent: HomepageContent = {
  welcomeTitle: `Bienvenido a ${APP_NAME}`,
  welcomeDescription: `Tu aliado de confianza en la seguridad de bicicletas. Registra tu bici, reporta robos y ayuda a construir una comunidad ciclista más segura.`,
  whyAppNameTitle: `¿Por qué ${APP_NAME}?`,
  feature1Title: "Registro Seguro",
  feature1Description:
    "Registra fácilmente tu bicicleta con su número de serie único, marca y modelo. Mantén la información de tu bici segura y accesible.",
  feature2Title: "Reporte de Robo",
  feature2Description:
    "En caso de robo, repórtalo rápidamente para alertar a la comunidad y a las autoridades. Aumenta las posibilidades de recuperación.",
  feature3Title: "Vigilancia Comunitaria",
  feature3Description:
    "Utiliza nuestra búsqueda pública para verificar el estado de una bicicleta antes de comprar una usada. Promueve la transparencia y disuade los robos.",
  communityTitle: "Únete a Nuestra Creciente Comunidad",
  communityDescription: `${APP_NAME} es más que una base de datos; es una red de ciclistas comprometidos con la protección de sus bienes y el apoyo mutuo. Al registrar tu bici, contribuyes a un entorno más seguro para todos.`,
  communityImageUrl: "https://placehold.co/600x400.png",
  sponsors: [
    {
      id: "def1",
      name: "Sponsor Ejemplo 1",
      logoUrl: "https://placehold.co/150x80.png",
      link: "#",
      dataAiHint: "company logo",
    },
    {
      id: "def2",
      name: "Sponsor Ejemplo 2",
      logoUrl: "https://placehold.co/150x80.png",
      link: "#",
      dataAiHint: "brand mark",
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  let fetchedContent: HomepageContent | null = null;
  try {
    fetchedContent = await getHomepageContentServer();
  } catch (error) {
    console.error("Error fetching homepage content for metadata:", error);
  }
  const title =
    fetchedContent?.welcomeTitle ||
    defaultContent.welcomeTitle.replace("{APP_NAME}", APP_NAME);
  const description =
    fetchedContent?.welcomeDescription || defaultContent.welcomeDescription;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
    },
    twitter: {
      title: title,
      description: description,
    },
  };
}

export default async function Page() {
  let initialContent: HomepageContent;
  try {
    const fetchedContent = await getHomepageContentServer();
    initialContent = fetchedContent || defaultContent;
  } catch (error) {
    console.error(
      "Error fetching homepage content for server component:",
      error,
    );
    initialContent = defaultContent;
  }

  return <HomePageClient initialContent={initialContent} />;
}
