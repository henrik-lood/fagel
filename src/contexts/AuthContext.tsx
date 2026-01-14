import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function register(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });

    // Check if user document already exists (shouldn't for new users)
    const userDocRef = doc(db, 'users', user.uid);
    const existingDoc = await getDoc(userDocRef);

    if (!existingDoc.exists()) {
      // Create user document with the existing structure
      await setDoc(userDocRef, {
        birds: [],
        birdsMaster: [],
        birdsLists: [],
      });
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Ingen användare inloggad');
    }

    // Re-authenticate the user first
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Now update the password
    await updatePassword(auth.currentUser, newPassword);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    changePassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
