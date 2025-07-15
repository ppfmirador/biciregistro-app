
import { getPublicRides } from '@/lib/db';
import RidesPageClient from '@/components/pageSpecific/RidesPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eventos Comunitarios',
  description: 'Encuentra y únete a los eventos organizados por ONGs y colectivos ciclistas en tu zona. Filtra por país, estado, modalidad y nivel para encontrar el evento perfecto para ti.',
};

export default async function RidesPage() {
    // Fetch all public rides on the server
    const rides = await getPublicRides();

    // Pass the initial list of rides to the client component for filtering and display
    return <RidesPageClient initialRides={rides} />;
}
