import { useState, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { BirdObservation, UserDocument } from '../types';

export function useObservations() {
  const { user } = useAuth();
  const [observations, setObservations] = useState<BirdObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setObservations([]);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserDocument;
          console.log('Raw user document:', data);
          console.log('Birds array:', data.birds);
          if (data.birds?.length > 0) {
            console.log('First observation sample:', data.birds[0]);
          }
          setObservations(data.birds || []);
        } else {
          console.log('User document does not exist');
          setObservations([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addObservation = async (observation: BirdObservation) => {
    if (!user) throw new Error('Måste vara inloggad');

    const userDocRef = doc(db, 'users', user.uid);

    // Check if bird already exists
    const existingIndex = observations.findIndex(
      (o) => o.birdId === observation.birdId
    );

    if (existingIndex >= 0) {
      // Merge with existing observation
      const updated = [...observations];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...observation,
      };
      await updateDoc(userDocRef, { birds: updated });
    } else {
      // Add new observation
      await updateDoc(userDocRef, {
        birds: arrayUnion(observation),
      }).catch(async () => {
        // Document might not exist, create it
        await setDoc(userDocRef, {
          birds: [observation],
        });
      });
    }
  };

  const updateObservation = async (
    birdId: string,
    updates: Partial<BirdObservation>
  ) => {
    if (!user) throw new Error('Måste vara inloggad');

    const userDocRef = doc(db, 'users', user.uid);
    // Replace the observation entirely (don't merge) so unchecked boxes are removed
    const updated = observations.map((o) =>
      o.birdId === birdId ? { birdId, ...updates } : o
    );
    await updateDoc(userDocRef, { birds: updated });
  };

  const deleteObservation = async (birdId: string) => {
    if (!user) throw new Error('Måste vara inloggad');

    const userDocRef = doc(db, 'users', user.uid);
    const updated = observations.filter((o) => o.birdId !== birdId);
    await updateDoc(userDocRef, { birds: updated });
  };

  return {
    observations,
    loading,
    error,
    addObservation,
    updateObservation,
    deleteObservation,
  };
}
