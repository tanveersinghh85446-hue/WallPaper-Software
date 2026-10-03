import { createContext, useCallback, useContext, useEffect, useState } from "react";

const FavoritesContext = createContext(null);
export const useFavorites = () => useContext(FavoritesContext);

const KEY = "walls:favorites";

// favorites file path se save hoti hain (id se nahi), taaki nayi images add karne par bhi sahi rahein
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggle = useCallback((file) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(file) ? next.delete(file) : next.add(file);
      return next;
    });
  }, []);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}
