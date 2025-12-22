import { useState, useEffect, useCallback } from 'react';
import { getCategories, addCategory, deleteCategory, updateCategory, updateCategoryOrder, updateCategoryCookies } from '../firestore';
import { type Category, type CookieCoordinate } from '../types';

export function useCategories(eventId: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const data = await getCategories(eventId);
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const add = async (name: string, imageUrl: string) => {
    try {
      const newCat = await addCategory(eventId, name, imageUrl);
      setCategories(prev => [...prev, newCat]);
      return newCat;
    } catch (err) {
      console.error('Error adding category:', err);
      throw err;
    }
  };

  const remove = async (categoryId: string, imageUrl: string) => {
    try {
      await deleteCategory(eventId, categoryId, imageUrl);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err) {
      console.error('Error deleting category:', err);
      throw err;
    }
  };

  const update = async (categoryId: string, updates: { name?: string }) => {
    try {
      await updateCategory(eventId, categoryId, updates);
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...updates } : c));
    } catch (err) {
      console.error('Error updating category:', err);
      throw err;
    }
  };

  const reorder = async (categoryId: string, newOrder: number) => {
    try {
      await updateCategoryOrder(eventId, categoryId, newOrder);
      // Optimistic update
      setCategories(prev => {
        const updated = prev.map(c => c.id === categoryId ? { ...c, order: newOrder } : c);
        return updated.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      });
    } catch (err) {
      console.error('Error reordering categories:', err);
      throw err;
    }
  };

  const updateCookies = async (categoryId: string, cookies: CookieCoordinate[]) => {
    try {
      await updateCategoryCookies(eventId, categoryId, cookies);
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, cookies } : c));
    } catch (err) {
      console.error('Error updating category cookies:', err);
      throw err;
    }
  };

  return { categories, loading, error, add, remove, update, reorder, updateCookies, refresh: loadCategories };
}
