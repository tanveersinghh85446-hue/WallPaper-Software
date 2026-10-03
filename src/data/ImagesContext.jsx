import { createContext, useContext, useEffect, useMemo, useState } from "react";
import MiniSearch from "minisearch";

const ImagesContext = createContext(null);
export const useImages = () => useContext(ImagesContext);

export function ImagesProvider({ children }) {
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    fetch("/images.json")
      .then((r) => {
        if (!r.ok) throw new Error("images.json nahi mila");
        return r.json();
      })
      .then((data) => {
        setImages(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const value = useMemo(() => {
    const mini = new MiniSearch({
      fields: ["title", "category", "keywords"],
      idField: "id",
      searchOptions: { prefix: true, fuzzy: 0.3, boost: { title: 2 }, combineWith: "AND" },
    });
    mini.addAll(images);

    const byId = new Map(images.map((i) => [i.id, i]));

    const counts = new Map();
    images.forEach((i) => counts.set(i.category, (counts.get(i.category) || 0) + 1));
    const categories = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const search = (q, category) => {
      let list = q.trim()
        ? mini.search(q.trim()).map((r) => byId.get(r.id))
        : images;
      if (category) {
        const c = category.toLowerCase();
        list = list.filter((i) => i.category.toLowerCase() === c);
      }
      return list;
    };

    return { images, status, categories, search };
  }, [images, status]);

  return <ImagesContext.Provider value={value}>{children}</ImagesContext.Provider>;
}
