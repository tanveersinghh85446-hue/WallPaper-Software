import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import { FiHeart, FiSearch, FiX } from "react-icons/fi";
import useDebounce from "../hooks/useDebounce.js";
import { useFavorites } from "../data/FavoritesContext.jsx";

export default function Navbar() {
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState(params.get("q") ?? "");
  const debounced = useDebounce(text, 300);
  const { favorites } = useFavorites();
  const inputRef = useRef(null);

  // The URL (?q=) updates 300ms after the user stops typing
  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        debounced.trim() ? next.set("q", debounced) : next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [debounced, setParams]);

  // Pressing "/" focuses the search box (desktop only)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-wall-3 bg-wall/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-[1800px] items-center gap-2 px-3 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight sm:text-2xl"
        >
          Walls
        </Link>

        <div className="relative min-w-0 flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-white/50 sm:left-4 sm:text-xl" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search wallpapers"
            aria-label="Search wallpapers"
            enterKeyHint="search"
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-full bg-wall-2 pl-10 pr-10 text-base outline-none ring-1 ring-wall-3 placeholder:text-white/40 focus:ring-2 focus:ring-accent sm:h-12 sm:pl-12 sm:pr-12"
          />
          {text && (
            <button
              onClick={() => {
                setText("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center text-xl text-white/60 hover:text-white"
            >
              <FiX />
            </button>
          )}
        </div>

        <NavLink
          to={{
            pathname: "/favorites",
            search: params.toString() ? `?${params}` : "",
          }}
          aria-label="Favorites"
          className={({ isActive }) =>
            `flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold sm:h-auto sm:px-4 sm:py-2.5 ${
              isActive ? "bg-accent text-wall" : "bg-wall-2 hover:bg-wall-3"
            }`
          }
        >
          <FiHeart className="text-lg" />
          <span className="hidden sm:inline">Favorites</span>
          {favorites.size > 0 && <span>{favorites.size}</span>}
        </NavLink>
      </div>
    </header>
  );
}
