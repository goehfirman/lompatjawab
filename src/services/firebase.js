import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

const FIREBASE_CONFIG_STORAGE_KEY = 'lompat_pilih_firebase_config_v1';
const COLLECTION_NAME = 'question_sets';

/**
 * Retrieve Firebase configuration from localStorage or Vite environment variables (.env)
 */
export function getFirebaseConfig() {
  // 1. First check if user saved custom credentials in localStorage
  try {
    const saved = localStorage.getItem(FIREBASE_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved Firebase config', e);
  }

  // 2. Then check Vite environment variables
  const env = import.meta.env;
  if (env && env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    const pId = env.VITE_FIREBASE_PROJECT_ID;
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${pId}.firebaseapp.com`,
      projectId: pId,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${pId}.appspot.com`,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: env.VITE_FIREBASE_APP_ID || ''
    };
  }

  return null;
}

/**
 * Save Firebase configuration to localStorage and re-initialize
 */
export function saveFirebaseConfig(config) {
  if (!config || !config.apiKey || !config.projectId) {
    throw new Error('Konfigurasi Firebase harus memiliki apiKey dan projectId yang valid.');
  }

  const pId = String(config.projectId).trim();
  const cleanConfig = {
    apiKey: String(config.apiKey).trim(),
    authDomain: String(config.authDomain || `${pId}.firebaseapp.com`).trim(),
    projectId: pId,
    storageBucket: String(config.storageBucket || `${pId}.appspot.com`).trim(),
    messagingSenderId: String(config.messagingSenderId || '').trim(),
    appId: String(config.appId || '').trim()
  };

  localStorage.setItem(FIREBASE_CONFIG_STORAGE_KEY, JSON.stringify(cleanConfig));
  return initFirebaseApp();
}

/**
 * Clear custom Firebase config from localStorage
 */
export function removeFirebaseConfig() {
  localStorage.removeItem(FIREBASE_CONFIG_STORAGE_KEY);
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured() {
  return !!getFirebaseConfig();
}

let cachedDb = null;

/**
 * Get or initialize Firebase app and Firestore instance
 */
export function initFirebaseApp() {
  const config = getFirebaseConfig();
  if (!config) {
    cachedDb = null;
    return null;
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.error('Failed to initialize Firebase App', err);
    cachedDb = null;
    return null;
  }
}

/**
 * Get Firestore database instance
 */
export function getDb() {
  if (!cachedDb) {
    return initFirebaseApp();
  }
  return cachedDb;
}

/**
 * Subscribe to real-time question sets updates from Firestore
 * @param {Function} onSetsUpdated - Callback when question sets update in cloud
 * @param {Function} onError - Callback on sync error
 * @returns {Function} Unsubscribe function
 */
export function subscribeToQuestionSets(onSetsUpdated, onError) {
  const db = getDb();
  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudSets = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.questions && Array.isArray(data.questions)) {
            cloudSets.push({
              ...data,
              id: docSnap.id
            });
          }
        });
        onSetsUpdated(cloudSets);
      },
      (err) => {
        console.error('Firestore snapshot error', err);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Error attaching Firestore snapshot listener', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Save or update a single question set in Firestore
 * @param {Object} set - Question set object
 */
export async function saveQuestionSetToCloud(set) {
  const db = getDb();
  if (!db || !set || !set.id) {
    return false;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, String(set.id));
    const payload = {
      id: set.id,
      title: set.title || 'Set Soal Kuis',
      subject: set.subject || 'Umum',
      grade: set.grade || 'SD',
      timerSeconds: Number(set.timerSeconds) || 10,
      randomizeQuestions: !!set.randomizeQuestions,
      shuffleChoices: !!set.shuffleChoices,
      questions: set.questions || [],
      updatedAt: Date.now()
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.error('Error saving question set to Firestore:', err);
    throw err;
  }
}

/**
 * Delete a question set from Firestore
 * @param {string} setId - ID of question set to delete
 */
export async function deleteQuestionSetFromCloud(setId) {
  const db = getDb();
  if (!db || !setId) return false;

  try {
    const docRef = doc(db, COLLECTION_NAME, String(setId));
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error('Error deleting question set from Firestore:', err);
    throw err;
  }
}

/**
 * Batch upload all local sets to Firestore (Initial Migration / Sync All)
 * @param {Array} sets - List of question sets
 */
export async function uploadAllSetsToCloud(sets) {
  const db = getDb();
  if (!db || !Array.isArray(sets) || sets.length === 0) return false;

  try {
    const batch = writeBatch(db);
    sets.forEach((set) => {
      if (set && set.id) {
        const docRef = doc(db, COLLECTION_NAME, String(set.id));
        const payload = {
          id: set.id,
          title: set.title || 'Set Soal Kuis',
          subject: set.subject || 'Umum',
          grade: set.grade || 'SD',
          timerSeconds: Number(set.timerSeconds) || 10,
          randomizeQuestions: !!set.randomizeQuestions,
          shuffleChoices: !!set.shuffleChoices,
          questions: set.questions || [],
          updatedAt: Date.now()
        };
        batch.set(docRef, payload, { merge: true });
      }
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error batch uploading question sets to Firestore:', err);
    throw err;
  }
}
