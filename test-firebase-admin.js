
const admin = require('firebase-admin');

console.log('--- Iniciando Prueba de Conexión de Firebase Admin ---');

const serviceAccountKey_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey_JSON) {
  console.error('ERROR CRÍTICO: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
  console.log('Asegúrate de haber creado un archivo .env.local y de haber añadido la variable allí.');
  process.exit(1);
}

console.log('Variable de entorno encontrada. Intentando parsear JSON...');

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountKey_JSON);
  console.log('JSON parseado exitosamente. Project ID en la credencial:', serviceAccount.project_id);
} catch (e) {
  console.error('ERROR CRÍTICO: La variable FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido.');
  console.error('El error fue:', e.message);
  console.log('Por favor, copia y pega el contenido COMPLETO del archivo JSON de la credencial.');
  process.exit(1);
}

console.log('Intentando inicializar la app de Firebase Admin...');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('¡ÉXITO! El SDK de Firebase Admin se inicializó correctamente.');
  
  const db = admin.firestore();
  console.log('Intentando conectar con Firestore...');
  
  db.collection('test-connection').limit(1).get()
    .then(snapshot => {
      console.log('¡ÉXITO! Conexión con Firestore establecida.');
      console.log('--- Prueba Finalizada Exitosamente ---');
      process.exit(0);
    })
    .catch(err => {
      console.error('ERROR CRÍTICO: Se inicializó el SDK, pero no se pudo conectar a Firestore.');
      console.error('El error fue:', err.message);
      console.log('Causa probable: El service account no tiene los permisos correctos en Google Cloud (ej. "Cloud Datastore User" o "Editor").');
      process.exit(1);
    });

} catch (e) {
  console.error('ERROR CRÍTICO: Falló la inicialización del SDK de Firebase Admin.');
  console.error('El error fue:', e.message);
  console.log('Causa probable: La credencial (service account key) es inválida, está expirada o no corresponde al proyecto.');
  process.exit(1);
}
