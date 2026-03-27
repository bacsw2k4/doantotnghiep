import { useState, useEffect } from "react";
import axios from "axios";

interface LanguageItem {
  id: number;
  language_id: number;
  language_key_id: number;
  title: string;
  desc?: string;
  status: string;
  language_key?: { title: string };
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

/**
 * Hook to fetch and retrieve language item values based on the selected language and key.
 * @param langId The current language ID
 * @returns An object with a getLanguageItem function to retrieve title by key
 */
export const useLanguageItem = (langId: number) => {
  const [languageItems, setLanguageItems] = useState<LanguageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguageItems = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/shopping/languages/get/?language_id=${langId}`);
        setLanguageItems(res.data.data || []);
        setError(null);
      } catch (err) {
        setError("Không lấy được danh sách language items");
        setLanguageItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (langId) {
      fetchLanguageItems();
    }
  }, [langId]);

  /**
   * Get the title of a language item by its key
   * @param key The language key title (language_key.title)
   * @param fallback Optional fallback value if key is not found
   * @returns The title of the language item or the fallback (or empty string)
   */
  const getLanguageItem = (key: string, fallback?: string): string => {
    const item = languageItems.find((item) => item.language_key?.title === key);
    return item?.title || fallback || "";
  };

  return { getLanguageItem, loading, error };
};