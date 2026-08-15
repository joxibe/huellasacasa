/**
 * HUELLAS A CASA — Servicio de Autenticación (Google Auth)
 * Gestiona el inicio de sesión y sincronización con /usuarios/{uid}
 */

import { isConfigured } from '../firebase-config.js';

// Estado local reactivo de la sesión
let currentUser = null;
const authSubscribers = [];

// Inicializar sesión desde localStorage si existe modo local/demo
try {
  const savedUser = localStorage.getItem('huellas_auth_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
  }
} catch (e) {
  console.warn('No se pudo restaurar la sesión local', e);
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
  if (isConfigured && window.firebase && window.firebase.auth) {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    const result = await window.firebase.auth().signInWithPopup(provider);
    currentUser = {
      uid: result.user.uid,
      displayName: result.user.displayName || 'Usuario de Google',
      email: result.user.email,
      photoURL: result.user.photoURL || null
    };
  } else {
    // Modo Demo/Pruebas locales instantáneas
    currentUser = {
      uid: 'demo_user_cali_' + Math.random().toString(36).substring(2, 8),
      displayName: 'Carlos Devia (Google)',
      email: 'carlos.cali.emergencia@gmail.com',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    };
  }

  localStorage.setItem('huellas_auth_user', JSON.stringify(currentUser));
  notifySubscribers();
  return currentUser;
}

/**
 * Cierra la sesión
 */
export async function logout() {
  if (isConfigured && window.firebase && window.firebase.auth) {
    await window.firebase.auth().signOut();
  }
  currentUser = null;
  localStorage.removeItem('huellas_auth_user');
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
