// Configuración y conexión de Firebase para Huellas a Casa
export const firebaseConfig = {
  apiKey: "AIzaSyBubjaIp-c1hAZdglnKw7yysoV8QD3O6L4",
  authDomain: "huellasacasa-23651.firebaseapp.com",
  projectId: "huellasacasa-23651",
  storageBucket: "huellasacasa-23651.firebasestorage.app",
  messagingSenderId: "839928117580",
  appId: "1:839928117580:web:921df612bbfad0e2bd37e9"
};

// Bandera para indicar si Firebase está configurado con credenciales válidas
export const isConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);