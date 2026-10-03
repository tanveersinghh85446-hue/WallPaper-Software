export default function Footer() {
  return (
    <footer className="border-t border-wall-3 px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-sm text-white/50">
      Walls
      <span className="hidden pointer-fine:inline">
        {" "}
        · press <kbd className="rounded bg-wall-2 px-1.5">/</kbd> to search
      </span>
    </footer>
  );
}
