/**
 * HUELLAS A CASA — Servicio de Autenticación (Google Auth)
 * Gestiona el inicio de sesión y sincronización con /usuarios/{uid}
 */

import { isFirebaseReady } from '../firebase-config.js';

// Estado local reactivo de la sesión
let currentUser = null;
const authSubscribers = [];

// Sincronización nativa con Firebase Auth en el navegador
if (typeof window !== 'undefined' && !window.__TEST__ && window.firebase && window.firebase.auth) {
  try {
    window.firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          displayName: user.displayName || 'Usuario de Google',
          email: user.email,
          photoURL: user.photoURL || null
        };
      } else {
        currentUser = null;
      }
      notifySubscribers();
    });
  } catch (e) {
    console.warn('Error al conectar listener de Firebase Auth:', e);
  }
}

/**
 * Suscribe una función para recibir cambios de autenticación
 * @param {Function} callback (user) => void
 */
export function onAuthStateChanged(callback) {
  authSubscribers.push(callback);
  // Ejecutar inmediatamente con el estado actual
  callback(currentUser);

  return () => {
    const idx = authSubscribers.indexOf(callback);
    if (idx !== -1) authSubscribers.splice(idx, 1);
  };
}

function notifySubscribers() {
  authSubscribers.forEach((cb) => {
    try {
      cb(currentUser);
    } catch (e) {
      console.error('Error en listener de auth:', e);
    }
  });
}

/**
 * Inicia sesión con Google
 */
export async function loginWithGoogle() {
  if (typeof window !== 'undefined' && !window.__TEST__) {
    if (!isFirebaseReady() || !window.firebase || !window.firebase.auth) {
      throw new Error('No se pudo conectar con el servicio de autenticación de Firebase. Por favor revisa tu conexión a internet o intenta de nuevo.');
    }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    const result = await window.firebase.auth().signInWithPopup(provider);
    currentUser = {
      uid: result.user.uid,
      displayName: result.user.displayName || 'Usuario de Google',
      email: result.user.email,
      photoURL: result.user.photoURL || null
    };
    notifySubscribers();
    return currentUser;
  }

  // Entorno de testing Node.js
  currentUser = {
    uid: 'test_user_node',
    displayName: 'Usuario de Pruebas',
    email: 'test@huellasacasa.org',
    photoURL: null
  };
  notifySubscribers();
  return currentUser;
}

/**
 * Cierra la sesión
 */
export async function logout() {
  if (typeof window !== 'undefined' && !window.__TEST__ && isFirebaseReady() && window.firebase && window.firebase.auth) {
    await window.firebase.auth().signOut();
  }
  currentUser = null;
  notifySubscribers();
}

/**
 * Retorna el usuario actualmente autenticado o null
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Verifica si hay una sesión activa
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Helper para testing y configuración manual de sesión
 */
export function setTestUser(user) {
  currentUser = user;
  if (user) {
    try {
      localStorage.setItem('huellas_auth_user', JSON.stringify(user));
    } catch (e) {}
  } else {
    try {
      localStorage.removeItem('huellas_auth_user');
    } catch (e) {}
  }
  notifySubscribers();
}
