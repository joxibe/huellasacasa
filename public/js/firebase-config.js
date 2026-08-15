// Configuración y conexión de Firebase para Huellas a Casa
export const firebaseConfig = {
  apiKey: "AIzaSyBubjaIp-c1hAZdglnKw7yysoV8QD3O6L4",
  authDomain: "huellasacasa-23651.firebaseapp.com",
  projectId: "huellasacasa-23651",
  storageBucket: "huellasacasa-23651.firebasestorage.app",
  messagingSenderId: "839928117580",
  appId: "1:839928117580:web:921df612bbfad0e2bd37e9"
};

// 1. Inicialización automática en el navegador si el SDK de Firebase ya fue cargado
if (typeof window !== 'undefined' && window.firebase) {
  try {
    if (!window.firebase.apps || window.firebase.apps.length === 0) {
      window.firebase.initializeApp(firebaseConfig);
    }
  } catch (err) {
    console.error('Error al inicializar Firebase SDK:', err);
  }
}

// 2. Bandera dinámica que valida la configuración y que la app esté realmente inicializada
export function isFirebaseReady() {
  if (typeof window === 'undefined' || window.__TEST__) return true;
  return Boolean(
    window.firebase &&
    window.firebase.apps &&
    window.firebase.apps.length > 0
  );
}

// Mantener compatibilidad con imports existentes
export const isConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);