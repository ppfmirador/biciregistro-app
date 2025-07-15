import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import { APP_NAME } from '@/constants';

const siteUrl = 'https://biciregistro.mx'; // Replace with your actual production domain

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${APP_NAME} - Registro y Seguridad de Bicicletas`,
    template: `%s | ${APP_NAME}`,
  },
  description: `Registra tu bicicleta, reporta robos y consulta el historial. Únete a la comunidad ${APP_NAME} para proteger tu rodada y fomentar un ciclismo más seguro en México.`,
  keywords: ['registro de bicicletas', 'reportar robo bicicleta', 'seguridad ciclista', APP_NAME, 'consultar número de serie bicicleta', 'México', 'bike registration', 'report stolen bike', 'bike security'],
  applicationName: APP_NAME,
  referrer: 'origin-when-cross-origin',
  authors: [{ name: APP_NAME }], // Or your company/developer name
  creator: APP_NAME, // Or your company/developer name
  publisher: APP_NAME, // Or your company/developer name
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: `${APP_NAME} - Registro y Seguridad de Bicicletas`,
    description: `Registra tu bicicleta, reporta robos y consulta el historial. Únete a la comunidad ${APP_NAME} para proteger tu rodada.`,
    url: siteUrl,
    siteName: APP_NAME,
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} - Registro y Seguridad de Bicicletas`,
    description: `Registra tu bicicleta, reporta robos y consulta el historial. Únete a la comunidad ${APP_NAME} para proteger tu rodada.`,
  },
  appleWebApp: {
    title: APP_NAME,
    statusBarStyle: 'default',
    capable: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/biciregistro-logo.png',
    apple: '/biciregistro-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": APP_NAME,
            "url": siteUrl
          }) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": APP_NAME,
            "url": siteUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${siteUrl}/?s={search_term_string}`, // Example search action
              "query-input": "required name=search_term_string"
            }
          }) }}
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
