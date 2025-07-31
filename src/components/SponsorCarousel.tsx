"use client";

import Image from "next/image";
import type { SponsorConfig } from "@/lib/types"; // Import SponsorConfig

interface SponsorCarouselProps {
  sponsors: SponsorConfig[];
}

const SponsorCarousel: React.FC<SponsorCarouselProps> = ({ sponsors }) => {
  if (!sponsors || sponsors.length === 0) {
    return (
      <div className="w-full py-6 sm:py-8 text-center">
        <p className="text-muted-foreground">Aún no hay aliados destacados.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-6 sm:py-8">
      <h3 className="text-xl sm:text-2xl font-semibold text-center text-foreground mb-4 sm:mb-6">
        Nuestros Aliados
      </h3>
      <div className="relative">
        <div
          className="flex overflow-x-auto space-x-6 sm:space-x-8 pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex-shrink-0 w-32 sm:w-40 h-20 sm:h-24 flex items-center justify-center p-2 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              style={{ scrollSnapAlign: "center" }}
            >
              <a
                href={sponsor.link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visitar ${sponsor.name}`}
                className="flex items-center justify-center w-full h-full"
              >
                <Image
                  src={sponsor.logoUrl || "https://placehold.co/150x80.png"} // Fallback if logoUrl is empty
                  alt={`${sponsor.name} Logo`}
                  width={140}
                  height={70}
                  className="object-contain max-h-full max-w-full"
                  data-ai-hint={sponsor.dataAiHint || "company logo"}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://placehold.co/150x80.png"; // Generic placeholder on error
                  }}
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SponsorCarousel;
