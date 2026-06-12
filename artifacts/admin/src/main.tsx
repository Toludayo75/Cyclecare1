import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initApiClient } from "./lib/api";
import App from "./App";
import "./index.css";

initApiClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
