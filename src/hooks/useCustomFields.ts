import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { CustomFieldDefinition, CustomFieldType } from '../types';

interface NewCustomField {
  name: string;
  type: CustomFieldType;
  options?: string[];
}

export function useCustomFields() {
  const { user } = useAuth();
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCustomFields([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'customFields'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fields = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CustomFieldDefinition[];
      setCustomFields(fields);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addCustomField = async (data: NewCustomField) => {
    if (!user) throw new Error('Måste vara inloggad');

    await addDoc(collection(db, 'customFields'), {
      ...data,
      userId: user.uid,
    });
  };

  const updateCustomField = async (id: string, data: Partial<NewCustomField>) => {
    await updateDoc(doc(db, 'customFields', id), data);
  };

  const deleteCustomField = async (id: string) => {
    await deleteDoc(doc(db, 'customFields', id));
  };

  return {
    customFields,
    loading,
    addCustomField,
    updateCustomField,
    deleteCustomField,
  };
}
