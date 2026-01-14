import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { BirdSpecies } from '../types';

export function useSpecies() {
  const { user } = useAuth();
  const [sharedSpecies, setSharedSpecies] = useState<BirdSpecies[]>([]);
  const [userSpecies, setUserSpecies] = useState<BirdSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load shared birds from 'birds' collection
  useEffect(() => {
    async function loadSharedSpecies() {
      try {
        const snapshot = await getDocs(collection(db, 'birds'));
        const birds = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.name || '',
            latinName: data.latinName || '',
            id: doc.id,
          } as BirdSpecies;
        });
        console.log('Loaded shared species:', birds.length);
        setSharedSpecies(birds);
      } catch (error) {
        console.error('Failed to load shared species:', error);
      }
    }
    loadSharedSpecies();
  }, []);

  // Load user's custom birds from 'users/{uid}/myBirds' subcollection
  useEffect(() => {
    async function loadUserSpecies() {
      if (!user) {
        setUserSpecies([]);
        setLoading(false);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'myBirds'));
        const birds = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            name: data.name || '',
            latinName: data.latinName || '',
            id: doc.id,
          } as BirdSpecies;
        });
        console.log('Loaded user custom species:', birds.length);
        setUserSpecies(birds);
      } catch (error) {
        console.error('Failed to load user species:', error);
      } finally {
        setLoading(false);
      }
    }
    loadUserSpecies();
  }, [user]);

  // Merge shared and user species (user species override shared ones with same ID)
  const species = useMemo(() => {
    const merged = new Map<string, BirdSpecies>();
    sharedSpecies.forEach((bird) => merged.set(bird.id, bird));
    userSpecies.forEach((bird) => merged.set(bird.id, bird));
    const result = Array.from(merged.values());
    result.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
    return result;
  }, [sharedSpecies, userSpecies]);

  const addSpecies = async (name: string, latinName: string): Promise<BirdSpecies> => {
    if (!user) throw new Error('Måste vara inloggad');

    // Add to user's myBirds subcollection
    const docRef = await addDoc(collection(db, 'users', user.uid, 'myBirds'), {
      name: name.toLowerCase(),
      latinName: latinName.toLowerCase(),
      creator: user.displayName || user.email || 'unknown',
    });
    const newSpecies: BirdSpecies = {
      id: docRef.id,
      name: name.toLowerCase(),
      latinName: latinName.toLowerCase(),
    };
    setUserSpecies((prev) => [...prev, newSpecies]);
    return newSpecies;
  };

  const filteredSpecies = useMemo(() => {
    if (!searchTerm.trim()) return species;

    const term = searchTerm.toLowerCase();
    return species.filter(
      (bird) =>
        bird.name.toLowerCase().includes(term) ||
        bird.latinName.toLowerCase().includes(term)
    );
  }, [species, searchTerm]);

  const getSpeciesById = (id: string): BirdSpecies | undefined => {
    return species.find((bird) => bird.id === id);
  };

  const getSpeciesMap = useMemo(() => {
    const map = new Map<string, BirdSpecies>();
    species.forEach((bird) => map.set(bird.id, bird));
    return map;
  }, [species]);

  return {
    species,
    filteredSpecies,
    searchTerm,
    setSearchTerm,
    getSpeciesById,
    getSpeciesMap,
    addSpecies,
    loading,
  };
}
