import { useState } from "react";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { fullUrl, thumbUrl, titleCase } from "../config.js";
import { useFavorites } from "../data/FavoritesContext.jsx";

// "pointer-fine:" means a mouse is available. On touch screens there is no hover,
// so the title and heart button are always visible there.
export default function ImageCard({ img, onOpen }) {
  const { favorites, toggle } = useFavorites();
  const [src, setSrc] = useState(thumbUrl(img));
  const liked = favorites.has(img.file);

  return (
    <div className="group relative aspect-4/3 overflow-hidden rounded-md bg-wall-2 sm:aspect-16/10">
      <button
        onClick={onOpen}
        className="block h-full w-full text-left"
        aria-label={`Open ${img.title}`}
      >
        <img
          src={src}
          alt={img.title}
          loading="lazy"
          decoding="async"
          // If the thumbnail is missing, fall back to the original image
          onError={() => src !== fullUrl(img) && setSrc(fullUrl(img))}
          className="h-full w-full object-cover transition-transform duration-300 pointer-fine:group-hover:scale-105"
        />
        <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/75 to-transparent px-2.5 pb-1.5 pt-6 text-xs font-semibold transition-opacity sm:px-3 sm:pb-2 sm:pt-8 sm:text-sm pointer-fine:opacity-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100">
          {titleCase(img.title)}
        </span>
      </button>
      <button
        onClick={() => toggle(img.file)}
        aria-label={liked ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={liked}
        className={`absolute right-1.5 top-1.5 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-lg backdrop-blur transition-opacity hover:bg-black/70 sm:right-2 sm:top-2 pointer-fine:h-9 pointer-fine:w-9 ${
          liked
            ? "text-rose-400"
            : "pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
        }`}
      >
        {liked ? <FaHeart /> : <FiHeart />}
      </button>
    </div>
  );
}
