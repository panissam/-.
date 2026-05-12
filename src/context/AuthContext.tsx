import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider, isUserAdmin } from '../lib/firebase';
import { UserProfile, StaffInfo } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffInfoByEmail = async (email: string): Promise<StaffInfo | undefined> => {
    const path = 'staff_directory';
    console.log(`Fetching staff info for ${email} from ${path}... Current User:`, auth.currentUser?.uid);
    try {
      const q = query(collection(db, path), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log('Staff info found:', data);
        return data as StaffInfo;
      } else {
        console.log('No staff info found for this email.');
      }
    } catch (err) {
      console.error('Error in fetchStaffInfoByEmail:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
    return undefined;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.email?.endsWith('@bu.ac.th')) {
          // Small delay to ensure Firestore picks up the auth token
          await new Promise(resolve => setTimeout(resolve, 500));
          const staffInfo = await fetchStaffInfoByEmail(firebaseUser.email);
          setUser(firebaseUser);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            role: isUserAdmin(firebaseUser.email) ? 'admin' : 'user',
            staffInfo,
          });
          setError(null);
        } else {
          // Strictly restricted to @bu.ac.th
          signOut(auth);
          setUser(null);
          setProfile(null);
          setError('กรุณาเข้าสู่ระบบด้วยอีเมล @bu.ac.th เท่านั้น');
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: isUserAdmin(user?.email || null),
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
