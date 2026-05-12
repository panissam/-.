import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Training, Booking } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Admin emails (Fixed list as requested)
export const ADMIN_EMAILS = [
  'panisara.l@bu.ac.th', // The user requesting
  'admin1@bu.ac.th',
  'admin2@bu.ac.th'
];

export const isUserAdmin = (email: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
};

// --- Firestore Helpers (Templates for future use) ---

// Get all trainings
export const getTrainings = async (): Promise<Training[]> => {
  const querySnapshot = await getDocs(collection(db, 'trainings'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Training));
};

// Book a training
export const bookTraining = async (training: Training, userId: string, userEmail: string) => {
  return await addDoc(collection(db, 'bookings'), {
    trainingId: training.id,
    trainingTitle: training.title,
    userId,
    userEmail,
    createdAt: serverTimestamp(),
  });
};

// Get user bookings
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const q = query(collection(db, 'bookings'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
};
