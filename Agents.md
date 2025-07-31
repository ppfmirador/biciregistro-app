# Guía de Colaboración y Configuración para el Proyecto

Este documento establece las mejores prácticas, guías y acuerdos de trabajo para la colaboración entre los desarrolladores humanos y el asistente de IA (App Prototyper) en este proyecto.

---

## Acuerdos de Trabajo (Working Agreements)

Para asegurar una colaboración fluida y efectiva, acordamos lo siguiente:

1.  **Enfoque en los Cambios Solicitados**: Al solicitar cambios, el asistente de IA se centrará en modificar únicamente las líneas de código directamente relacionadas con la tarea o el arreglo solicitado. No se realizarán refactorizaciones o cambios de estilo en código no relacionado, a menos que se pida explícitamente.
2.  **Contexto Completo**: El asistente de IA siempre recibirá y tendrá en cuenta la estructura completa de los archivos existentes para asegurar que los nuevos cambios se integren sin introducir errores.
3.  **Acciones del Desarrollador Humano**: El asistente de IA siempre indicará de manera explícita si se requiere alguna acción por parte del desarrollador para completar un proceso. Esto incluye, pero no se limita a:
    - Ejecutar comandos en la terminal (ej. `npm install`, `firebase deploy`).
    - Configurar elementos en la consola de Firebase o Google Cloud (ej. habilitar APIs, establecer reglas de seguridad).
    - Obtener y configurar variables de entorno o claves secretas (ej. tokens de App Check, claves de API).
4.  **Claridad en la Comunicación**: Ambas partes se esforzarán por ser claras y concisas. Si una solicitud es ambigua, el asistente de IA pedirá aclaraciones antes de proceder.
5.  **Conocimiento del Entorno de Compilación**: Se ha aprendido que el entorno de Cloud Functions tiene un proceso de compilación (TypeScript a JavaScript) que afecta las rutas de los archivos. El asistente de IA debe tener esto en cuenta, especialmente al manejar recursos como archivos `.json`, y proponer soluciones que funcionen tanto en el código fuente como en el código compilado que se despliega.

---

## Guía para Prompts Efectivos

Para obtener los mejores resultados del asistente de IA, estructura tus solicitudes de la siguiente manera:

- **Sé Específico**: En lugar de "Arregla el formulario", di "En el formulario de registro de bicicletas (`register-bike/page.tsx`), el campo 'Modelo' no se está validando. Asegúrate de que requiera al menos 2 caracteres".
- **Proporciona Contexto**: Si el cambio involucra varios archivos, menciónalos. Ejemplo: "Necesito añadir un campo 'tipo' al formulario de bicicletas. Esto requiere actualizar el schema en `src/lib/schemas.ts`, el formulario en `BikeForm.tsx` y la Cloud Function `createBike`".
- **Incluye Mensajes de Error**: Si tienes un error, copia y pega el mensaje completo de la consola o del navegador. Esto es extremadamente útil para un diagnóstico rápido.
- **Separa las Tareas Complejas**: Si necesitas una nueva funcionalidad grande, divídela en tareas más pequeñas. Por ejemplo, en lugar de "Crea el portal para tiendas", empieza con "Crea la página del dashboard para tiendas en `/bikeshop/dashboard` con un diseño básico y un título".

---

## Scripts y Comandos Útiles

Estos son los comandos más comunes que necesitarás para este proyecto. Ejecútalos desde la raíz del proyecto.

- **Iniciar el servidor de desarrollo**:
  ```bash
  npm run dev
  ```
- **Desplegar a Staging**: Sube la aplicación y las funciones al proyecto de Firebase de _staging_.
  ```bash
  npm run deploy:staging
  ```
- **Desplegar a Producción**: Sube la aplicación y las funciones al proyecto de Firebase de _producción_.
  ```bash
  npm run deploy:prod
  ```
- **Desplegar solo Cloud Functions**: Útil cuando solo cambias la lógica del backend.

  ```bash
  # Para staging
  firebase deploy -P staging --only functions

  # Para producción
  firebase deploy -P default --only functions
  ```

- **Ejecutar Linters y Chequeo de Tipos**: Verifica la calidad del código antes de hacer un commit.

  ```bash
  npm run validate

  # Para arreglar problemas de formato en las funciones:
  cd functions && npm run format && cd ..
  ```

---

## Checklist de Configuración en Firebase

Asegúrate de que los siguientes elementos estén configurados correctamente en tu proyecto de Firebase para evitar errores comunes.

### **Autenticación**

- [ ] **Proveedores de Inicio de Sesión**: Habilita los proveedores que usarás (Email/Contraseña, Google) en `Firebase Console > Authentication > Sign-in method`.
- [ ] **Dominios Autorizados**: Asegúrate de que tus dominios de desarrollo, staging y producción estén en la lista de dominios autorizados.
  - `localhost`
  - `bike-guardian-staging.web.app` (o tu dominio de staging)
  - `biciregistro.mx` (o tu dominio de producción)
  - La URL de tu entorno de Cloud Workstations (ej. `https://6000-....cloudworkstations.dev`).

### **App Check**

- [ ] **Habilitar API**: Asegúrate de que la API de "Firebase App Check" esté habilitada en Google Cloud Console.
- [ ] **Configuración de Proveedores**:
  - **reCAPTCHA v3**: Registra tu sitio para obtener una clave de reCAPTCHA v3 y añádela a la configuración de App Check para tus aplicaciones web.
  - **Debug Token**: Para el desarrollo local (`npm run dev`), genera un token de depuración desde la consola del navegador y añádelo al archivo `.env.local` como `NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN`.
- [ ] **Aplicación Forzosa**: En la sección de App Check de cada servicio (Cloud Functions, Storage, etc.), establece la aplicación forzosa (`enforce`) para producción.

### **Cloud Functions**

- [ ] **CORS**: El archivo `functions/src/index.ts` debe tener configurados los orígenes permitidos (`allowedOrigins`) para aceptar solicitudes de todos tus entornos. **Importante**: El archivo de configuración (`cors.json`) debe estar _dentro_ del directorio `functions/src` y ser copiado al directorio `lib` durante la compilación.
- [ ] **Permisos IAM**: El service account por defecto de las funciones (`PROJECT_ID@appspot.gserviceaccount.com`) debe tener los roles necesarios, como `Firebase Admin` y `Cloud Functions Invoker`.

### **Firestore (Base de Datos)**

- [ ] **Reglas de Seguridad**: Las reglas en `firestore.rules` deben estar desplegadas y configuradas para permitir el acceso correcto a los usuarios autenticados y proteger los datos sensibles.
- [ ] **Índices**: Si creas consultas complejas (ej. `orderBy` y `where` en campos diferentes), Firebase te pedirá crear índices. Asegúrate de que estén definidos en `firestore.indexes.json` y desplegados.
