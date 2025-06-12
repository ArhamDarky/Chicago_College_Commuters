import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, Firestore } from 'firebase/firestore';
import type { ScheduleItem } from '@/types/schedule';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result; // Contains user, credential, etc.
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    // Handle specific error codes if needed, e.g., error.code === 'auth/popup-closed-by-user'
    throw error; // Re-throw or handle as appropriate for your UI
  }
};

const signOutUser = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Wrapper for onAuthStateChanged to match the expected signature in SmartCommutePage
const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};


const saveSchedules = async (userId: string, schedules: ScheduleItem[]): Promise<void> => {
  if (!userId) throw new Error("User ID is required to save schedules.");
  try {
    const userScheduleRef = doc(db, 'userSchedules', userId);
    await setDoc(userScheduleRef, { schedules });
    // console.log("Schedules saved for user:", userId); // Optional: keep for debugging
  } catch (error) {
    console.error("Error saving schedules to Firestore:", error);
    throw error; // Re-throw to be caught by the caller
  }
};

const loadSchedules = async (userId: string): Promise<ScheduleItem[]> => {
  if (!userId) {
    // console.log("No user ID provided, returning empty schedules array."); // Optional: keep for debugging
    return [];
  }
  try {
    const userScheduleRef = doc(db, 'userSchedules', userId);
    const docSnap = await getDoc(userScheduleRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure schedules is an array, provide default if undefined or not an array
      return Array.isArray(data.schedules) ? data.schedules : [];
    } else {
      // console.log("No schedule document found for user:", userId); // Optional: keep for debugging
      return []; // No document, so no schedules
    }
  } catch (error) {
    console.error("Error loading schedules from Firestore:", error);
    throw error; // Re-throw to be caught by the caller
  }
};

export { 
  auth, 
  db,
  googleProvider, 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChanged,
  saveSchedules,
  loadSchedules,
  type User 
};
