import { useEffect, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiHeart,
  FiX,
} from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { fullUrl, thumbUrl, titleCase } from "../config.js";
import { useFavorites } from "../data/FavoritesContext.jsx";

// Shows the small thumbnail instantly (blurred) while the big original loads.
// Important on phones, where the original can be several MB.
function Stage({ img }) {
  const [loaded, setLoaded] = useState(false);
  const big =
    "col-start-1 row-start-1 max-h-full max-w-full rounded-md object-contain transition-opacity duration-300";
  return (
    <>
      <img
        src={thumbUrl(img)}
        alt=""
        aria-hidden="true"
        className={`${big} blur-sm ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={fullUrl(img)}
        alt={img.title}
        onLoad={() => setLoaded(true)}
        className={`${big} ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}

function Actions({ img }) {
  const { favorites, toggle } = useFavorites();
  const liked = favorites.has(img.file);
  const ext = img.file.split(".").pop();
  return (
    <>
      <button
        onClick={() => toggle(img.file)}
        aria-pressed={liked}
        className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-wall-2 px-4 text-sm font-semibold hover:bg-wall-3 sm:h-auto sm:flex-none sm:py-2 ${liked ? "text-rose-400" : ""}`}
      >
        {liked ? <FaHeart /> : <FiHeart />} {liked ? "Saved" : "Save"}
      </button>
      <a
        href={fullUrl(img)}
        download={`${img.title.replace(/\s+/g, "-")}.${ext}`}
        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-wall hover:brightness-110 sm:h-auto sm:flex-none sm:py-2"
      >
        <FiDownload /> Download
      </a>
    </>
  );
}

export default function ImageModal({ img, onClose, onPrev, onNext }) {
  const touch = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  // Swipe left/right for next/previous, swipe down to close
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return (touch.current = null); // ignore pinch-zoom
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
      (dx < 0 ? onNext : onPrev)();
    else if (dy > 100 && dy > Math.abs(dx) * 1.5) onClose();
  };

  const navBtn =
    "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-2xl hover:bg-black/80 sm:grid";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={img.title}
      className="fixed inset-0 z-50 flex flex-col overscroll-contain bg-black pt-[env(safe-area-inset-top)] sm:bg-black/95"
      onClick={onClose}
    >
      <div
        className="flex items-center gap-3 px-4 py-2 sm:px-6 sm:py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="min-w-0 flex-1 truncate text-base font-bold sm:text-lg">
          {titleCase(img.title)}
        </h2>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Actions img={img} />
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-wall-2 text-xl hover:bg-wall-3 sm:h-10 sm:w-10"
        >
          <FiX />
        </button>
      </div>

      <div
        className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center px-3 pb-3 sm:px-16 sm:pb-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous"
          className={`${navBtn} left-3`}
        >
          <FiChevronLeft />
        </button>
        {/* key remounts Stage so every new image starts with its own loading state */}
        <Stage key={img.file} img={img} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next"
          className={`${navBtn} right-3`}
        >
          <FiChevronRight />
        </button>
      </div>

      {/* Phones: big Save and Download buttons at the bottom, easy to reach with a thumb */}
      <div
        className="flex gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Actions img={img} />
      </div>
    </div>
  );
}
