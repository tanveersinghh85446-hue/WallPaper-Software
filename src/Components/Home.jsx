import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useImages } from "../data/ImagesContext.jsx";
import { useFavorites } from "../data/FavoritesContext.jsx";
import { titleCase } from "../config.js";
import CategoryBar from "./CategoryBar.jsx";
import ImageCard from "./ImageCard.jsx";
import ImageModal from "./ImageModal.jsx";

// Number of wallpapers shown at once. More are loaded as the user scrolls.
const PAGE = 36;

function Gallery({ category, favoritesOnly, q }) {
  const { status, search } = useImages();
  const { favorites } = useFavorites();
  const [visible, setVisible] = useState(PAGE);
  const [openIndex, setOpenIndex] = useState(null);
  const sentinel = useRef(null);

  const list = useMemo(() => {
    const found = search(q, category);
    return favoritesOnly ? found.filter((i) => favorites.has(i.file)) : found;
  }, [search, q, category, favoritesOnly, favorites]);

  // Infinite scroll: load the next page when the sentinel comes near the viewport
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [list.length, status]);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i - 1 + list.length) % list.length),
    [list.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i + 1) % list.length),
    [list.length],
  );

  if (status === "loading") {
    return (
      <p className="px-6 py-16 text-center text-white/60">
        Loading wallpapers…
      </p>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h2 className="text-xl font-bold">Couldn't load the wallpaper list</h2>
        <p className="mt-2 text-white/70">
          Put your images in{" "}
          <code className="rounded bg-wall-2 px-1.5">public/images</code>, then
          run <code className="rounded bg-wall-2 px-1.5">npm run generate</code>{" "}
          in the terminal.
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-[1800px] px-3 pb-10 sm:px-6">
      <p className="pb-3 text-sm text-white/60 sm:pb-4">
        {list.length.toLocaleString()} wallpaper{list.length === 1 ? "" : "s"}
        {q && <> for “{q}”</>}
        {category && <> in {titleCase(category)}</>}
      </p>

      {list.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-xl font-bold">
            {favoritesOnly && !q ? "No favorites yet" : "No results found"}
          </h2>
          <p className="mt-2 text-white/70">
            {favoritesOnly && !q
              ? "Tap the heart on any wallpaper and it will be saved here."
              : "Try a different keyword or check the spelling."}
          </p>
          {favoritesOnly && !q && (
            <Link
              to="/"
              className="mt-5 inline-block rounded-full bg-accent px-5 py-2 font-bold text-wall"
            >
              Browse wallpapers
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 2xl:grid-cols-5">
          {list.slice(0, visible).map((img, i) => (
            <ImageCard key={img.id} img={img} onOpen={() => setOpenIndex(i)} />
          ))}
        </div>
      )}

      {visible < list.length && <div ref={sentinel} className="h-10" />}

      {openIndex !== null && list[openIndex] && (
        <ImageModal
          img={list[openIndex]}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </section>
  );
}

export default function Home({ favoritesOnly = false }) {
  const { name } = useParams();
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = name ? decodeURIComponent(name) : "";

  return (
    <>
      {!favoritesOnly && <CategoryBar />}
      {favoritesOnly && (
        <h1 className="mx-auto max-w-[1800px] px-3 pb-3 pt-5 text-2xl font-extrabold sm:px-6 sm:pt-6">
          Favorites
        </h1>
      )}
      {/* Changing the key resets the visible count whenever the search or category changes */}
      <Gallery
        key={`${category}|${q}|${favoritesOnly}`}
        category={category}
        favoritesOnly={favoritesOnly}
        q={q}
      />
    </>
  );
}
