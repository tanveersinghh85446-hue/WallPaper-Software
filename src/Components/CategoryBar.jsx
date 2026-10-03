import { NavLink, useLocation } from "react-router-dom";
import { useImages } from "../data/ImagesContext.jsx";
import { titleCase } from "../config.js";

export default function CategoryBar() {
  const { categories } = useImages();
  const { search } = useLocation(); // keeps the search text when the category changes

  if (categories.length < 2) return null;

  const chip = ({ isActive }) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
      isActive
        ? "bg-white text-wall"
        : "bg-wall-2 text-white/80 hover:bg-wall-3"
    }`;

  return (
    <nav
      aria-label="Categories"
      className="no-scrollbar mx-auto flex max-w-[1800px] gap-2 overflow-x-auto px-3 pb-3 pt-3 sm:px-6 sm:pb-4 sm:pt-4"
    >
      <NavLink to={{ pathname: "/", search }} end className={chip}>
        All
      </NavLink>
      {categories.map((c) => (
        <NavLink
          key={c.name}
          to={{ pathname: `/category/${encodeURIComponent(c.name)}`, search }}
          className={chip}
        >
          {titleCase(c.name)}
        </NavLink>
      ))}
    </nav>
  );
}
