import { useState, useEffect } from 'react';
import { PasswordEntry, PasswordFormData } from '../types/Password';

export const usePasswordStorage = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('password-entries');
    if (stored) {
      try {
        const parsedEntries = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }));
        setEntries(parsedEntries);
      } catch {
        // Invalid stored data - start fresh
      }
    }
  }, []);

  const saveToStorage = (newEntries: PasswordEntry[]) => {
    localStorage.setItem('password-entries', JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const addEntry = (data: PasswordFormData) => {
    const newEntry: PasswordEntry = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const newEntries = [...entries, newEntry];
    saveToStorage(newEntries);
  };

  const updateEntry = (id: string, data: PasswordFormData) => {
    const newEntries = entries.map(entry =>
      entry.id === id
        ? { ...entry, ...data, updatedAt: new Date() }
        : entry
    );
    saveToStorage(newEntries);
  };

  const deleteEntry = (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveToStorage(newEntries);
  };

  const searchEntries = (query: string): PasswordEntry[] => {
    if (!query) return entries;
    
    const lowercaseQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(lowercaseQuery) ||
      entry.login.toLowerCase().includes(lowercaseQuery) ||
      (entry.url && entry.url.toLowerCase().includes(lowercaseQuery)) ||
      (entry.description && entry.description.toLowerCase().includes(lowercaseQuery))
    );
  };

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries
  };
};