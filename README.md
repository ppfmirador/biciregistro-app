# Bike Guardian / Biciregistro

A modern platform for bicycle registration and community-based theft prevention.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture Diagram](#architecture-diagram)
- [Feature Catalog](#feature-catalog)
- [Permissions Matrix](#permissions-matrix)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Testing](#testing)
- [Deploy & CI/CD](#deploy--cicd)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Contributing Guidelines](#contributing-guidelines)
- [License](#license)

---

## Project Overview

**Mission:** To build a safer cycling community by providing a centralized, trustworthy platform for bicycle registration, theft reporting, and public verification. We empower cyclists, bike shops, and community organizations to work together in protecting their assets and promoting transparency.

**Tech Stack:**
- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **UI:** [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend:** [Firebase Cloud Functions v2](https://firebase.google.com/docs/functions) (Callable Functions)
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
- **Storage:** [Firebase Cloud Storage](https://firebase.google.com/docs/storage) for images and documents.
- **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth) (Email/Password, Google)
- **Security:** [Firebase App Check](https://firebase.google.com/docs/app-check) with reCAPTCHA v3.
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## Architecture Diagram

This diagram explains the high-level interaction between the system components.

```ascii
+-----------------+      +---------------------+      +----------------+
|   Next.js App   |----->|  Firebase Hosting   |<---->|      User      |
| (React/ShadCN)  |      |   (App Hosting)     |      +----------------+
+-------+---------+      +---------------------+
        |
        | (HTTPS Call / App Check Verified)
        v
+-------+----------------+      +------------------+
| Firebase Cloud Functions |<---->|    Firestore     |
|    (v2 Callable)       |      | (Database)       |
+------------------------+      +------------------+
        |
        v
+-------+----------------+
| Firebase Cloud Storage |
| (Images, Docs)         |
+------------------------+
```

## Feature Catalog

| # | Feature                    | User Roles Involved      | Description                                                                                              | Key Files / Modules                                                                                                             |
|---|----------------------------|--------------------------|----------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| 1 | **User Authentication**    | All                      | Email/Password and Google sign-in. Role-based access control (cyclist, bikeshop, ngo, admin).             | `src/context/AuthContext.tsx`, `src/app/auth/page.tsx`                                                                          |
| 2 | **Bike Registration**      | Cyclist, Bike Shop       | Register a bike with serial number, brand, model, photos, and optional ownership document.               | `src/app/register-bike/page.tsx`, `src/components/bike/BikeForm.tsx`, `functions/src/index.ts` (createBike)           |
| 3 | **Bike Details View**      | All                      | Public view shows status and basic details. Owner view includes private info and management tools.         | `src/app/bike/[serialNumber]/page.tsx`                                                                                            |
| 4 | **Theft Reporting**        | Cyclist (Owner)          | Mark a bike as "Stolen" with incident details, alerting the community.                                     | `src/components/bike/ReportTheftDialog.tsx`, `functions/src/index.ts` (reportBikeStolen)                               |
| 5 | **Ownership Transfer**     | Cyclist (Owner)          | Initiate a transfer request to another registered user via email.                                          | `src/components/bike/TransferOwnershipDialog.tsx`, `functions/src/index.ts` (initiateTransferRequest, respondToTransferRequest) |
| 6 | **Dashboard**              | Cyclist                  | View personal bikes and manage incoming/outgoing transfer requests.                                        | `src/app/dashboard/page.tsx`, `src/components/bike/BikeCard.tsx`                                                                |
| 7 | **Admin Panel**            | Admin                    | Manage users, roles, homepage content, and create Bike Shop/NGO accounts.                                | `src/app/admin/page.tsx`, `functions/src/index.ts` (admin functions)                                                          |
| 8 | **Bike Shop Portal**       | Bike Shop, Admin         | Shops can register bikes for customers, view their registration history, and create public events.    | `src/app/bikeshop/dashboard/page.tsx`, `src/app/bikeshop/register-sold-bike/page.tsx`                                             |
| 9 | **NGO Portal**             | NGO, Admin               | NGOs can manage their profile, invite members via referral links, view community stats, and create events.  | `src/app/ngo/dashboard/page.tsx`                                                                                                  |
| 10| **Public Events Board**     | All                      | A public page where anyone can view upcoming events organized by Bike Shops and NGOs.                       | `src/app/rides/page.tsx`, `src/components/pageSpecific/RidesPageClient.tsx`                                                   |
| 11| **QR Code Management**     | Cyclist (Owner)          | Generate and download a QR code that links to the bike's public verification page.                         | `src/app/bike/[serialNumber]/qr/page.tsx`, `src/components/bike/QrCodeDisplay.tsx`                                              |
| 12| **File Uploads**           | All (where applicable)   | Securely upload images (JPG, PNG) and documents (PDF) to Firebase Storage.                                 | `src/lib/storage.ts`                                                                                                            |
| 13| **Referral System**        | Cyclist, NGO             | Users can invite others via a unique referral link (`?ref=...`). NGO dashboards provide easy access to this. | `src/context/AuthContext.tsx` (signUp), `lib/db.ts` (incrementReferralCount)                                                    |
| 14| **First Admin Creation**   | Manual (initial setup)   | A one-time callable function to elevate the first user to an admin role.                                     | `functions/src/index.ts` (createFirstAdmin)                                                                                 |

## Permissions Matrix

This matrix outlines the capabilities of each user role within the BiciRegistro platform.

| Funcionalidad                               | Público (No Auth) | Ciclista (Autenticado) | Tienda de Bicis | ONG / Colectivo | Administrador |
|---------------------------------------------|:-----------------:|:----------------------:|:---------------:|:---------------:|:-------------:|
| **Búsqueda Pública de Bicis**               | ✅                 | ✅                      | ✅               | ✅               | ✅             |
| Ver Detalles Públicos de Bici               | ✅                 | ✅                      | ✅               | ✅               | ✅             |
| Ver Detalles Privados de Bici               | ❌                 | Solo Propias           | Solo Clientes   | ❌               | ✅ (Todas)     |
| **Registrar Bicicleta**                     | ❌                 | ✅ (Para sí mismo)      | ✅ (Para Clientes) | ✅ (Para sí mismo) | ❌             |
| **Editar Detalles de Bici**                 | ❌                 | ✅ (Solo Propias)      | ❌               | ❌               | ✅ (Todas)     |
| Reportar Robo de Bici                       | ❌                 | ✅ (Solo Propias)      | ❌               | ❌               | ✅ (Todas)     |
| Marcar Bici como Recuperada                 | ❌                 | ✅ (Solo Propias)      | ❌               | ❌               | ✅ (Todas)     |
| Iniciar Transferencia de Propiedad          | ❌                 | ✅ (Solo Propias)      | ❌               | ❌               | ✅ (Todas)     |
| Aceptar/Rechazar Transferencia              | ❌                 | ✅ (Solo si es destinatario) | ❌               | ❌               | ✅ (Todas)     |
| Generar Código QR para Bici                 | ❌                 | ✅ (Solo Propias)      | ❌               | ❌               | ✅ (Todas)     |
| **Gestionar Perfil Propio**                 | ❌                 | ✅                      | ✅               | ✅               | ✅             |
| **Crear/Gestionar Eventos (Rodadas)**       | ❌                 | ❌                      | ✅               | ✅               | ✅ (Todas)     |
| Ver Panel de Estadísticas                   | ❌                 | ❌                      | ✅ (Propias)     | ✅ (Propias)     | ✅ (Globales)  |
| Invitar Amigos (Referidos)                  | ❌                 | ✅                      | ❌               | ✅               | ✅             |
| **Panel de Admin**                          | ❌                 | ❌                      | ❌               | ❌               | ✅             |
| Gestionar Roles de Usuario                  | ❌                 | ❌                      | ❌               | ❌               | ✅             |
| Crear Cuentas de Tienda/ONG                 | ❌                 | ❌                      | ❌               | ❌               | ✅             |
| Editar Contenido de Página Principal        | ❌                 | ❌                      | ❌               | ❌               | ✅             |

## Setup & Installation

Follow these steps to get the project running locally.

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v20 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Firebase CLI](https://firebase.google.com/docs/cli#install_the_firebase_cli) (v13.0.0 or higher)

**1. Clone the Repository**
```bash
git clone <repository-url>
cd <repository-directory>
```

**2. Install Dependencies**
This project uses `npm` for its scripts.
```bash
npm install
cd functions && npm install && cd ..
```
The Firebase Cloud Functions entry point is located at `functions/src/index.ts`.

**3. Configure Firebase**
The project uses Firebase for its backend services.

- **Link the CLI to your project:**
  ```bash
  # Authenticate with Google
  firebase login

  # Add your Firebase project alias (e.g., 'default' or 'dev')
  firebase use --add
  ```
- **Set up your Firebase configuration keys:** The current codebase hardcodes keys in `src/lib/firebase.ts`. **This is not secure for production but acceptable for development.** The recommended practice is to use environment variables. Create a file named `.env.local` in the root of the project and add your Firebase project's web configuration:
  ```plaintext
  # .env.local
  NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_MESSAGING_SENDER_ID"
  NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

  # For local development with App Check
  NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN="YOUR_APP_CHECK_DEBUG_TOKEN"
  ```
  > **Note:** You would then refactor `src/lib/firebase.ts` to use `process.env.NEXT_PUBLIC_...` instead of the hardcoded values.

**4. Create the First Admin User (One-Time Setup)**
To manage the platform, you need an administrator account. This is a manual, one-time process using a special Cloud Function.
- **Deploy the functions:** `npm run deploy:staging` or `npm run deploy:prod`
- **Create the user:** Ensure the user you want to promote exists in Firebase Authentication (e.g., register them via the app).
- **Run the function:** Open the developer console in your browser on the deployed site and execute the `createFirstAdmin` callable function, passing the user's email.
- **IMPORTANT:** After creating the admin, you should instruct the AI Prototyper to **remove the `createFirstAdmin` function** from the codebase for security.

**5. Run the Development Server**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

## Environment Configuration

| Variable                                  | Description                                                                                                                                                             | Example                               |
|-------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY`              | Firebase project API key.                                                                                                                                               | `AIzaSy...`                           |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`          | Firebase project auth domain.                                                                                                                                           | `my-project.firebaseapp.com`          |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`           | Firebase project ID.                                                                                                                                                    | `my-project`                          |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`       | Firebase project storage bucket.                                                                                                                                        | `my-project.appspot.com`              |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`  | Firebase project messaging sender ID.                                                                                                                                   | `1234567890`                          |
| `NEXT_PUBLIC_FIREBASE_APP_ID`               | Firebase project app ID.                                                                                                                                                | `1:12345...`                          |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN` | **Optional.** The debug token for [Firebase App Check](https://firebase.google.com/docs/app-check/web/debug-provider) to allow local testing. Found in the browser console on first run. | `a-long-uuid-string...`               |

## Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end (E2E) testing.

- **Run all E2E tests:**
  ```bash
  npm run e2e
  ```
- **Run E2E tests in UI mode:**
  ```bash
  npx playwright test --ui
  ```
- **Linting & Type Checking:**
  ```bash
  # Check for code style and linting issues
  npm run lint

  # Perform a TypeScript type check
  npm run typecheck
  ```
Test files are located in the `e2e/` directory.

## Deploy & CI/CD

- **Build the project for production:**
  ```bash
  npm run build
  ```
- **Deploy to Firebase:** The project is configured for Firebase App Hosting. Deploy all services with:
  ```bash
  firebase deploy
  ```
  Or use the predefined scripts for different environments:
  ```bash
  # Deploy to the STAGING project
  npm run deploy:staging
  
  # Deploy to the PRODUCTION project
  npm run deploy:prod
  ```
- **Deploy only specific services:**
  ```bash
  # Deploy only Hosting (the Next.js app)
  firebase deploy --only hosting

  # Deploy only Cloud Functions
  firebase deploy --only functions

  # Deploy only Firestore rules
  firebase deploy --only firestore:rules
  ```
> **Note:** A CI/CD pipeline using GitHub Actions is recommended for automating builds, tests, and deployments. This is not yet implemented.

## Troubleshooting & FAQ

- **CORS Errors:** If you experience CORS errors from Cloud Functions, ensure your local development URL (e.g., `http://localhost:3000` or your Gitpod/Cloud Workstation URL) is added to `cors.json` in the root directory.
- **App Check Errors (403 Forbidden):** When running locally, App Check will block requests. Open the browser's developer console. You will see an App Check message with a debug token. Copy this token and add it to `.env.local` as `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`.
- **Firebase Auth Redirects:** For authentication to work correctly on a custom domain, the `apphosting.yaml` file contains necessary rewrite rules. Ensure this is not modified unless you understand the implications.

## Contributing Guidelines

1.  **Branching:** Create a new branch from `main` for every new feature or bug fix.
    -   `feat/feature-name` (e.g., `feat/add-bike-sharing`)
    -   `fix/bug-description` (e.g., `fix/login-button-alignment`)
2.  **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format.
    -   `feat: Add user profile editing page`
    -   `fix: Correct validation error in bike registration form`
    -   `docs: Update README with setup instructions`
3.  **Code Reviews:** All pull requests must be reviewed by at least one other engineer before merging. Ensure your PR passes all automated checks (linting, testing).

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
