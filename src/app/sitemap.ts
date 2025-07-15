
import { MetadataRoute } from 'next';

const siteUrl = 'https://biciregistro.mx'; // Replace with your actual production domain

export default function sitemap(): MetadataRoute.Sitemap {
  // Add static routes
  const staticRoutes = [
    '', // Homepage
    '/auth',
    '/bikeshop/auth',
    // Add other static public pages here, e.g., '/about', '/contact'
  ].map((route) => ({
    url: `${siteUrl}${route === '' ? '/' : route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'monthly' as 'daily' | 'monthly', // Homepage might change more often
    priority: route === '' ? 1.0 : 0.8,
  }));

  // For dynamic routes (e.g., individual bike pages), you would fetch them here.
  // Example (requires fetching actual bike serial numbers from your DB):
  // const bikes = await getAllBikeSerialNumbersFromDB(); // Placeholder function
  // const bikeRoutes = bikes.map(serial => ({
  //   url: `${siteUrl}/bike/${encodeURIComponent(serial)}`,
  //   lastModified: new Date().toISOString(), // Or use actual modification date if available
  //   changeFrequency: 'weekly',
  //   priority: 0.7,
  // }));

  return [
    ...staticRoutes,
    // ...bikeRoutes, // Uncomment and implement if you have dynamic bike pages
  ];
}
