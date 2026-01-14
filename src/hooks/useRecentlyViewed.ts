import { useState, useEffect, useCallback } from 'react';

interface RecentlyViewedProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  category: string;
  viewedAt: number;
}

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentlyViewedProduct[];
        // Filter out items older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter((item) => item.viewedAt > thirtyDaysAgo);
        setRecentlyViewed(filtered);
      }
    } catch (error) {
      console.error('Error loading recently viewed products:', error);
    }
  }, []);

  // Save to localStorage whenever the list changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
    } catch (error) {
      console.error('Error saving recently viewed products:', error);
    }
  }, [recentlyViewed]);

  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, 'viewedAt'>) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to the beginning
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentlyViewed,
    addProduct,
    clearHistory,
  };
};
