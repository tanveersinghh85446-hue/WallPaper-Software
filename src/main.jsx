import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { ImagesProvider } from "./data/ImagesContext.jsx";
import { FavoritesProvider } from "./data/FavoritesContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ImagesProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </ImagesProvider>
    </BrowserRouter>
  </StrictMode>
);
