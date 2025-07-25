import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import FirebaseClientInitializer from '@/components/layout/FirebaseClientInitializer';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: `BiciRegistro - Registro y Seguridad de Bicicletas`,
    template: `%s | BiciRegistro`,
  },
  description: `Registra tu bicicleta, reporta robos y consulta el historial. Únete a la comunidad BiciRegistro para proteger tu rodada y fomentar un ciclismo más seguro en México.`,
  keywords: ['registro de bicicletas', 'reportar robo bicicleta', 'seguridad ciclista', 'BiciRegistro', 'consultar número de serie bicicleta', 'México', 'bike registration', 'report stolen bike', 'bike security'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className={`${inter.variable}`}>
      <head>
        {/* Head tags like scripts and metadata links are fine here */}
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster />
        </AuthProvider>
        <FirebaseClientInitializer />
      </body>
    </html>
  );
}
